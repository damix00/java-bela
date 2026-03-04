package pro.damjan.belabackend.websocket;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import pro.damjan.belabackend.messaging.MessageBroker;
import pro.damjan.belabackend.messaging.MessageListener;

import java.util.HashMap;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class GameWebSocketHandlerTest {

    @Mock
    private MessageBroker messageBroker;

    private GameWebSocketHandler handler;

    @BeforeEach
    void setUp() {
        handler = new GameWebSocketHandler(messageBroker);
    }

    private WebSocketSession mockSession(String userId) {
        WebSocketSession session = mock(WebSocketSession.class);
        Map<String, Object> attrs = new HashMap<>();
        attrs.put("userId", userId);
        when(session.getAttributes()).thenReturn(attrs);
        return session;
    }

    // --- afterConnectionEstablished ---

    @Test
    void afterConnectionEstablished_subscribesToBroker() throws Exception {
        WebSocketSession session = mockSession("user-1");

        handler.afterConnectionEstablished(session);

        verify(messageBroker).subscribe(eq("user:user-1"), any(MessageListener.class));
    }

    @Test
    void afterConnectionEstablished_subscribesOnlyOnceForSameUser() throws Exception {
        WebSocketSession session1 = mockSession("user-1");
        WebSocketSession session2 = mockSession("user-1");

        handler.afterConnectionEstablished(session1);
        handler.afterConnectionEstablished(session2);

        // subscribe should be called only once (on first connection)
        verify(messageBroker, times(1)).subscribe(eq("user:user-1"), any(MessageListener.class));
    }

    @Test
    void afterConnectionEstablished_brokerMessageIsSentToAllSessions() throws Exception {
        WebSocketSession session1 = mockSession("user-1");
        WebSocketSession session2 = mockSession("user-1");

        handler.afterConnectionEstablished(session1);
        handler.afterConnectionEstablished(session2);

        // Capture the listener registered with the broker
        ArgumentCaptor<MessageListener> listenerCaptor = ArgumentCaptor.forClass(MessageListener.class);
        verify(messageBroker).subscribe(eq("user:user-1"), listenerCaptor.capture());
        MessageListener listener = listenerCaptor.getValue();

        // Simulate a message arriving
        listener.onMessage("user:user-1", "hello");

        verify(session1).sendMessage(new TextMessage("hello"));
        verify(session2).sendMessage(new TextMessage("hello"));
    }

    // --- afterConnectionClosed ---

    @Test
    void afterConnectionClosed_removesSession() throws Exception {
        WebSocketSession session1 = mockSession("user-1");
        WebSocketSession session2 = mockSession("user-1");

        handler.afterConnectionEstablished(session1);
        handler.afterConnectionEstablished(session2);

        handler.afterConnectionClosed(session1, CloseStatus.NORMAL);

        // Should NOT unsubscribe because session2 is still active
        verify(messageBroker, never()).unsubscribe("user:user-1");
    }

    @Test
    void afterConnectionClosed_unsubscribesWhenLastSessionRemoved() throws Exception {
        WebSocketSession session = mockSession("user-1");

        handler.afterConnectionEstablished(session);
        handler.afterConnectionClosed(session, CloseStatus.NORMAL);

        verify(messageBroker).unsubscribe("user:user-1");
    }

    @Test
    void afterConnectionClosed_noErrorWhenUserHasNoSessions() {
        WebSocketSession session = mockSession("unknown-user");

        // Should not throw
        assertDoesNotThrow(() -> handler.afterConnectionClosed(session, CloseStatus.NORMAL));
    }

    // --- sendToUser ---

    @Test
    void sendToUser_publishesThroughBroker() {
        handler.sendToUser("user-1", "{\"type\":\"move\"}");

        verify(messageBroker).publish("user:user-1", "{\"type\":\"move\"}");
    }
}

