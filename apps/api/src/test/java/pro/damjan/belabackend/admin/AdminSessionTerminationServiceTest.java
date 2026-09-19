package pro.damjan.belabackend.admin.account;

import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import pro.damjan.belabackend.messaging.MessageBroker;
import pro.damjan.belabackend.messaging.MessageListener;
import pro.damjan.belabackend.user.presence.UserPresenceService;
import pro.damjan.belabackend.user.presence.session.SessionService;
import pro.damjan.belabackend.websocket.GameWebSocketHandler;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;

class AdminSessionTerminationServiceTest {
    @Test
    void closesLocalSocketsWhenAnyInstancePublishesATermination() {
        MessageBroker broker = mock(MessageBroker.class);
        GameWebSocketHandler handler = mock(GameWebSocketHandler.class);
        AdminSessionTerminationService service = new AdminSessionTerminationService(
                broker,
                handler,
                mock(SessionService.class),
                mock(UserPresenceService.class)
        );
        ArgumentCaptor<MessageListener> listener = ArgumentCaptor.forClass(MessageListener.class);

        service.subscribe();
        verify(broker).subscribe(anyString(), listener.capture());
        listener.getValue().onMessage("admin:session-termination", "user-1");

        verify(handler).closeUserSessions("user-1");
    }

    @Test
    void removesRedisStateAfterACommittedDeletionAndBroadcastsTheClose() {
        MessageBroker broker = mock(MessageBroker.class);
        SessionService sessions = mock(SessionService.class);
        UserPresenceService presence = mock(UserPresenceService.class);
        GameWebSocketHandler handler = mock(GameWebSocketHandler.class);
        AdminSessionTerminationService service = new AdminSessionTerminationService(
                broker,
                handler,
                sessions,
                presence
        );

        service.terminate(new AdminAccountSignedOutEvent("user-1", true));

        verify(sessions).deleteUserSessions("user-1");
        verify(presence).deleteUserPresence("user-1");
        verify(handler).closeUserSessions("user-1");
        ArgumentCaptor<String> channel = ArgumentCaptor.forClass(String.class);
        verify(broker).publish(channel.capture(), org.mockito.ArgumentMatchers.eq("user-1"));
        assertThat(channel.getValue()).isEqualTo("admin:session-termination");
    }
}
