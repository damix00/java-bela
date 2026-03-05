package pro.damjan.belabackend.websocket.events;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.SmartInitializingSingleton;
import org.springframework.context.ApplicationContext;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.WebSocketSession;

import jakarta.annotation.PostConstruct;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

import java.lang.reflect.Method;
import java.util.HashMap;
import java.util.Map;

@Slf4j
@Component
public class WebSocketEventRegistry implements SmartInitializingSingleton {

    private final ApplicationContext applicationContext;
    private final ObjectMapper objectMapper;
    private final Map<String, EventHandler> handlers = new HashMap<>();

    public WebSocketEventRegistry(ApplicationContext applicationContext, ObjectMapper objectMapper) {
        this.applicationContext = applicationContext;
        this.objectMapper = objectMapper;
    }

    @Override
    public void afterSingletonsInstantiated() {
        for (String beanName : applicationContext.getBeanDefinitionNames()) {
            Object bean = applicationContext.getBean(beanName);
            for (Method method : bean.getClass().getDeclaredMethods()) {
                OnEvent annotation = method.getAnnotation(OnEvent.class);
                if (annotation != null) {
                    method.setAccessible(true);
                    String eventName = annotation.value();
                    if (handlers.containsKey(eventName)) {
                        throw new IllegalStateException("Duplicate @OnEvent handler for event: " + eventName);
                    }
                    handlers.put(eventName, new EventHandler(bean, method));
                    log.info("Registered WebSocket event handler: {} -> {}.{}",
                            eventName, bean.getClass().getSimpleName(), method.getName());
                }
            }
        }
    }

    public void dispatch(WebSocketSession session, String event, JsonNode body) throws Exception {
        EventHandler handler = handlers.get(event);
        if (handler == null) {
            log.warn("No handler for event: {}", event);
            return;
        }

        Method method = handler.method();
        Class<?>[] paramTypes = method.getParameterTypes();
        Object[] args = new Object[paramTypes.length];

        for (int i = 0; i < paramTypes.length; i++) {
            if (WebSocketSession.class.isAssignableFrom(paramTypes[i])) {
                args[i] = session;
            } else if (JsonNode.class.isAssignableFrom(paramTypes[i])) {
                args[i] = body;
            } else {
                args[i] = body != null
                        ? objectMapper.treeToValue(body, paramTypes[i])
                        : null;
            }
        }

        method.invoke(handler.bean(), args);
    }

    private record EventHandler(Object bean, Method method) {}
}