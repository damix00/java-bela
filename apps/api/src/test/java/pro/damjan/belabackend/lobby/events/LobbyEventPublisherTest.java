package pro.damjan.belabackend.lobby.events;

import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import pro.damjan.belabackend.game.model.BeloteGame;
import pro.damjan.belabackend.game.model.GameStatus;
import pro.damjan.belabackend.game.model.config.GameConfiguration;
import pro.damjan.belabackend.game.model.player.GamePlayer;
import pro.damjan.belabackend.game.model.player.Team;
import pro.damjan.belabackend.game.model.player.TeamPair;
import pro.damjan.belabackend.lobby.events.dto.outgoing.LobbyGameCreatedEvent;
import pro.damjan.belabackend.lobby.events.dto.outgoing.LobbyConfigurationChangedEvent;
import pro.damjan.belabackend.lobby.model.Lobby;
import pro.damjan.belabackend.lobby.model.LobbyPlayer;
import pro.damjan.belabackend.lobby.model.LobbyPlayerStatus;
import pro.damjan.belabackend.user.presence.session.SessionService;
import pro.damjan.belabackend.websocket.events.WebSocketPublisher;
import pro.damjan.belabackend.websocket.events.dto.OutgoingEvent;
import tools.jackson.databind.ObjectMapper;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;

class LobbyEventPublisherTest {

    /**
     * `lobby:gameCreated` ships the whole {@link BeloteGame}, hands and all, and is only safe
     * because a game is announced before it is dealt. Nothing in the type enforces that, so this is
     * what does: if the announcement ever moves after the deal, every seat's cards would go to the
     * whole table and this fails.
     */
    @Test
    void theGameAnnouncementCarriesNobodysCards() {
        WebSocketPublisher webSocketPublisher = mock(WebSocketPublisher.class);
        LobbyEventPublisher publisher = new LobbyEventPublisher(
                mock(SessionService.class), webSocketPublisher);
        Lobby lobby = new Lobby();
        lobby.addPlayer(new LobbyPlayer("host-id", true, LobbyPlayerStatus.NOT_READY));

        List<GamePlayer> players = List.of(
                new GamePlayer("host-id", 0, false),
                new GamePlayer("p1", 1, false),
                new GamePlayer("p2", 2, false),
                new GamePlayer("p3", 3, false)
        );
        TeamPair teams = Team.pairFrom(players);
        BeloteGame game = BeloteGame.builder()
                .id("game-1")
                .team1(teams.teamA())
                .team2(teams.teamB())
                .config(GameConfiguration.ranked())
                .status(GameStatus.WAITING)
                .build();

        publisher.gameCreated(lobby, game);

        ArgumentCaptor<OutgoingEvent> eventCaptor = ArgumentCaptor.forClass(OutgoingEvent.class);
        verify(webSocketPublisher).sendToActiveSession(eq("host-id"), eventCaptor.capture());
        LobbyGameCreatedEvent event = (LobbyGameCreatedEvent) eventCaptor.getValue();

        assertThat(event.getGame().getCurrentRound()).isNull();
        assertThat(event.getGame().getPlayers())
                .allSatisfy(player -> assertThat(player.getHand()).isEmpty());
        assertThat(new ObjectMapper().valueToTree(event).toString())
                .doesNotContain("\"rank\"");
    }

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
