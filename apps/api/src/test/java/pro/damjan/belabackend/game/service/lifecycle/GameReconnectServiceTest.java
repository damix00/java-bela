package pro.damjan.belabackend.game.service.lifecycle;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import pro.damjan.belabackend.game.events.BeloteGameEventPublisher;
import pro.damjan.belabackend.game.model.BeloteGame;
import pro.damjan.belabackend.game.model.GameStatus;
import pro.damjan.belabackend.game.model.config.GameConfiguration;
import pro.damjan.belabackend.game.model.player.GamePlayer;
import pro.damjan.belabackend.game.model.player.Team;
import pro.damjan.belabackend.game.model.player.TeamPair;
import pro.damjan.belabackend.game.service.BeloteGameService;
import pro.damjan.belabackend.user.presence.UserPresence;
import pro.damjan.belabackend.user.presence.UserPresenceService;
import pro.damjan.belabackend.user.presence.events.UserReconnectedEvent;
import pro.damjan.belabackend.user.presence.session.SessionService;
import pro.damjan.belabackend.user.presence.session.UserSession;

import java.time.Instant;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class GameReconnectServiceTest {

    private UserPresenceService userPresenceService;
    private SessionService sessionService;
    private BeloteGameService beloteGameService;
    private BeloteGameEventPublisher beloteGameEventPublisher;
    private GameReconnectService gameReconnectService;

    private final UserReconnectedEvent event = new UserReconnectedEvent("p0", "session-id");

    @BeforeEach
    void setUp() {
        userPresenceService = mock(UserPresenceService.class);
        sessionService = mock(SessionService.class);
        beloteGameService = mock(BeloteGameService.class);
        beloteGameEventPublisher = mock(BeloteGameEventPublisher.class);
        gameReconnectService = new GameReconnectService(
                userPresenceService,
                sessionService,
                beloteGameService,
                beloteGameEventPublisher
        );

        when(sessionService.getActiveSession("p0")).thenReturn(session("session-id"));
        when(userPresenceService.getUserPresence("p0"))
                .thenReturn(new UserPresence(Instant.now(), "lobby-id", "game-1"));
    }

    @Test
    void reconnectingIntoAGameInProgressSendsASnapshot() {
        BeloteGame game = game(GameStatus.IN_PROGRESS);
        when(beloteGameService.findGameById("game-1")).thenReturn(game);

        gameReconnectService.handleReconnect(event);

        verify(beloteGameEventPublisher).sendSnapshot(game, "p0");
        verify(beloteGameService, never()).leaveGame(anyString());
    }

    @Test
    void reconnectingIntoAFinishedGameReturnsThePlayerToTheirLobbyInstead() {
        when(beloteGameService.findGameById("game-1")).thenReturn(game(GameStatus.FINISHED));

        gameReconnectService.handleReconnect(event);

        verify(beloteGameService).leaveGame("p0");
        verify(beloteGameEventPublisher, never()).sendSnapshot(any(BeloteGame.class), anyString());
    }

    @Test
    void reconnectingIntoAGameThatIsGoneClearsTheStaleGameId() {
        when(beloteGameService.findGameById("game-1")).thenReturn(null);

        gameReconnectService.handleReconnect(event);

        verify(userPresenceService).cancelUserGame("p0");
        verify(beloteGameEventPublisher, never()).sendSnapshot(any(BeloteGame.class), anyString());
    }

    @Test
    void aSessionThatHasSinceLostTheSeatGetsNoSnapshot() {
        // A newer connection took the seat between the handshake and this call; the snapshot
        // belongs to that one, and sending it here would resume the game in the wrong window.
        when(sessionService.getActiveSession("p0")).thenReturn(session("newer-session-id"));
        when(beloteGameService.findGameById("game-1")).thenReturn(game(GameStatus.IN_PROGRESS));

        gameReconnectService.handleReconnect(event);

        verify(beloteGameEventPublisher, never()).sendSnapshot(any(BeloteGame.class), anyString());
    }

    private UserSession session(String id) {
        UserSession session = new UserSession();
        session.setId(id);
        session.setUserId("p0");
        session.setActive(true);
        return session;
    }

    private BeloteGame game(GameStatus status) {
        List<GamePlayer> players = List.of(
                new GamePlayer("p0", 0),
                new GamePlayer("p1", 1),
                new GamePlayer("p2", 2),
                new GamePlayer("p3", 3)
        );
        TeamPair teams = Team.pairFrom(players);
        return BeloteGame.builder()
                .id("game-1")
                .team1(teams.teamA())
                .team2(teams.teamB())
                .config(GameConfiguration.ranked())
                .status(status)
                .build();
    }
}
