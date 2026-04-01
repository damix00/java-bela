package pro.damjan.belabackend.websocket.events;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import pro.damjan.belabackend.messaging.MessageBroker;
import pro.damjan.belabackend.user.presence.session.SessionService;
import pro.damjan.belabackend.user.presence.session.UserSession;
import pro.damjan.belabackend.websocket.events.dto.OutgoingEvent;
import tools.jackson.databind.ObjectMapper;

import java.util.Map;

@Service
@RequiredArgsConstructor
public class WebSocketPublisher {

    private final MessageBroker messageBroker;
    private final ObjectMapper objectMapper;
    private final SessionService sessionService;

    /**
     * Send a message to a user. Publishes through the message broker so it
     * reaches the user regardless of which server instance they are connected to.
     */
    public void sendToUser(String userId, OutgoingEvent event) {
        messageBroker.publish(
                WebSocketChannels.CHANNEL_PREFIX + userId,
                objectMapper.writeValueAsString(Map.of("event", event.getEventName(), "data", event))
        );
    }

    public void sendToUserSession(String userId, String sessionId, OutgoingEvent event) {
        messageBroker.publish(
                WebSocketChannels.CHANNEL_PREFIX + userId + WebSocketChannels.SESSION_ID_ATTRIBUTE + sessionId,
                objectMapper.writeValueAsString(Map.of("event", event.getEventName(), "data", event))
        );
    }

    public void sendToActiveSession(String userId, OutgoingEvent event) {
        UserSession session = sessionService.getActiveSession(userId);
        if (session != null) {
            sendToUserSession(userId, session.getId(), event);
        }
    }

}
