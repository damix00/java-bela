package pro.damjan.belabackend.lobby.events;

import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import pro.damjan.belabackend.game.model.config.GameConfiguration;
import pro.damjan.belabackend.lobby.events.dto.outgoing.LobbyConfigurationChangedEvent;
import pro.damjan.belabackend.lobby.model.Lobby;
import pro.damjan.belabackend.lobby.model.LobbyPlayer;
import pro.damjan.belabackend.lobby.model.LobbyPlayerStatus;
import pro.damjan.belabackend.user.presence.session.SessionService;
import pro.damjan.belabackend.websocket.events.WebSocketPublisher;
import pro.damjan.belabackend.websocket.events.dto.OutgoingEvent;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;

class LobbyEventPublisherTest {

    @Test
    void configChangedBroadcastsUpdatedConfiguration() {
        WebSocketPublisher webSocketPublisher = mock(WebSocketPublisher.class);
        LobbyEventPublisher publisher = new LobbyEventPublisher(
                mock(SessionService.class), webSocketPublisher);
        Lobby lobby = new Lobby();
        lobby.addPlayer(new LobbyPlayer("host-id", true, LobbyPlayerStatus.NOT_READY));
        lobby.setGameConfiguration(GameConfiguration.privateGame(701));

        publisher.configChanged(lobby);

        ArgumentCaptor<OutgoingEvent> eventCaptor = ArgumentCaptor.forClass(OutgoingEvent.class);
        verify(webSocketPublisher).sendToActiveSession(eq("host-id"), eventCaptor.capture());
        LobbyConfigurationChangedEvent event =
                (LobbyConfigurationChangedEvent) eventCaptor.getValue();
        assertThat(event.getEventName()).isEqualTo("lobby:configChanged");
        assertThat(event.getConfiguration()).isEqualTo(GameConfiguration.privateGame(701));
    }
}
