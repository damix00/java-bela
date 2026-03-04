package pro.damjan.belabackend.websocket;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;
import pro.damjan.belabackend.messaging.MessageBroker;

import java.io.IOException;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

@Slf4j
@Component
public class GameWebSocketHandler extends TextWebSocketHandler {

    private static final String CHANNEL_PREFIX = "user:";

    private final Map<String, Set<WebSocketSession>> sessions = new ConcurrentHashMap<>();
    private final MessageBroker messageBroker;

    public GameWebSocketHandler(MessageBroker messageBroker) {
        this.messageBroker = messageBroker;
    }

    @Override
    public void afterConnectionEstablished(WebSocketSession session) {
        String userId = (String) session.getAttributes().get("userId");

        sessions.computeIfAbsent(userId, k -> {
            // Subscribe to message broker for this user when they first connect
            messageBroker.subscribe(CHANNEL_PREFIX + userId, (channel, message) -> {
                // Send message to all sessions of this user
                Set<WebSocketSession> userSessions = sessions.get(userId);
                if (userSessions != null) {
                    for (WebSocketSession s : userSessions) {
                        try {
                            s.sendMessage(new TextMessage(message));
                        } catch (IOException e) {
                            log.error("Failed to send message to user [{}]", userId, e);
                        }
                    }
                }
            });
            return ConcurrentHashMap.newKeySet();
        }).add(session);

        log.info("WebSocket connection established for user [{}]", userId);
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) {
        // parse JSON
        // route event
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
        String userId = (String) session.getAttributes().get("userId");

        Set<WebSocketSession> userSessions = sessions.get(userId);

        if (userSessions != null) {
            userSessions.remove(session);

            if (userSessions.isEmpty()) {
                // Unsubscribe from message broker when last session for this user disconnects
                messageBroker.unsubscribe(CHANNEL_PREFIX + userId);
                sessions.remove(userId);
            }
        }

        log.info("WebSocket connection closed for user [{}]", userId);
    }

    /**
     * Send a message to a user. Publishes through the message broker so it
     * reaches the user regardless of which server instance they are connected to.
     */
    public void sendToUser(String userId, String payload) {
        messageBroker.publish(CHANNEL_PREFIX + userId, payload);
    }
}
