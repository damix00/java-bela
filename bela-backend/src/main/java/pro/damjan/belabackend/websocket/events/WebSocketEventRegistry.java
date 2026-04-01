package pro.damjan.belabackend.websocket.events;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.SmartInitializingSingleton;
import org.springframework.context.ApplicationContext;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketMessage;
import org.springframework.web.socket.WebSocketSession;
import pro.damjan.belabackend.exception.ExceptionResponse;
import pro.damjan.belabackend.user.User;
import pro.damjan.belabackend.user.presence.session.UserSession;
import pro.damjan.belabackend.websocket.events.dto.IncomingEvent;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

import java.lang.reflect.InvocationTargetException;
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
            Class<?> type = paramTypes[i];

            if (UserSession.class.isAssignableFrom(type)) {
                args[i] = session.getAttributes().get("userSession");
            } else if (User.class.isAssignableFrom(type)) {
                // String parameter receives the userId from the session
                args[i] = session.getAttributes().get("user");
            } else if (IncomingEvent.class.isAssignableFrom(type)) {
                args[i] = objectMapper.treeToValue(body, type);
            } else {
                throw new IllegalStateException("Unsupported parameter type in @OnEvent handler: " + type.getName());
            }
        }

        try {
            log.info("Dispatching event '{}' to handler {}.{} with args: {}",
                    event, handler.bean().getClass().getSimpleName(), method.getName(), args);
            method.invoke(handler.bean(), args);
        } catch (InvocationTargetException e) {
            if (e.getCause() instanceof ExceptionResponse response) {
                log.error("Error handling event '{}': {}", event, response.getMessage());

                // if the exception is an ExceptionResponse, send an error message back to the client
                session.sendMessage(new TextMessage(objectMapper.writeValueAsString(Map.of(
                        "event", "error:" + event,
                        "message", response.getMessage(),
                        "status", response.getStatus().value()
                ))));
            } else {
                log.error("Unexpected error handling event '{}'", event, e);
                session.sendMessage(new TextMessage(objectMapper.writeValueAsString(Map.of(
                        "event", "error:" + event,
                        "message", "An unexpected error occurred while processing the event.",
                        "status", 500
                ))));
            }
        }
    }

    private record EventHandler(Object bean, Method method) {}
}