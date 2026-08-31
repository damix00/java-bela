package pro.damjan.belabackend.user.presence.session;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import pro.damjan.belabackend.user.presence.session.events.dto.outgoing.SessionSupersededEvent;
import pro.damjan.belabackend.websocket.events.WebSocketPublisher;
import pro.damjan.belabackend.websocket.events.dto.OutgoingEvent;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class SessionTakeoverServiceTest {

    private SessionService sessionService;
    private WebSocketPublisher webSocketPublisher;
    private SessionTakeoverService sessionTakeoverService;

    @BeforeEach
    void setUp() {
        sessionService = mock(SessionService.class);
        webSocketPublisher = mock(WebSocketPublisher.class);
        sessionTakeoverService = new SessionTakeoverService(sessionService, webSocketPublisher);
    }

    @Test
    void theNewSessionTakesTheSeatAndTheOldOneIsToldItLostIt() {
        when(sessionService.deactivateOtherSessions("user-id", "new-session"))
                .thenReturn(List.of(session("old-session")));

        sessionTakeoverService.takeOver("user-id", "new-session");

        ArgumentCaptor<OutgoingEvent> event = ArgumentCaptor.forClass(OutgoingEvent.class);
        verify(webSocketPublisher).sendToUserSession(eq("user-id"), eq("old-session"), event.capture());
        assertThat(event.getValue()).isInstanceOf(SessionSupersededEvent.class);
        assertThat(event.getValue().getEventName()).isEqualTo("session:superseded");
        verify(sessionService).lockSession("new-session");
    }

    @Test
    void aFirstConnectionTakesTheSeatWithoutAnnouncingAnything() {
        when(sessionService.deactivateOtherSessions("user-id", "new-session")).thenReturn(List.of());

        sessionTakeoverService.takeOver("user-id", "new-session");

        verify(webSocketPublisher, never()).sendToUserSession(anyString(), anyString(), any());
        verify(sessionService).lockSession("new-session");
    }

    private UserSession session(String id) {
        UserSession session = new UserSession();
        session.setId(id);
        session.setUserId("user-id");
        return session;
    }
}
