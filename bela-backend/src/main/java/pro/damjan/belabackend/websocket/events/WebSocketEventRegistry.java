package pro.damjan.belabackend.websocket.events;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.SmartInitializingSingleton;
import org.springframework.context.ApplicationContext;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.WebSocketSession;

import pro.damjan.belabackend.websocket.events.dto.IncomingEvent;
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

        // 1st argument is always WebSocketSession, 2nd is always an instance of IncomingEvent if specified
        Object[] args = new Object[2];

        if (paramTypes.length > 0) {
            if (!WebSocketSession.class.isAssignableFrom(paramTypes[0])) {
                throw new IllegalStateException("First parameter of @OnEvent handler must be WebSocketSession");
            }
            args[0] = session;
        }

        if (paramTypes.length > 1) {
            if (!IncomingEvent.class.isAssignableFrom(paramTypes[1])) {
                throw new IllegalStateException("Second parameter of @OnEvent handler must be a subclass of IncomingEvent");
            }

            args[1] = objectMapper.treeToValue(body, paramTypes[1]);
        }

        method.invoke(handler.bean(), args);
    }

    private record EventHandler(Object bean, Method method) {}
}