package pro.damjan.belabackend.game.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.context.ApplicationEventPublisher;
import pro.damjan.belabackend.game.events.GameAbandonedEvent;
import pro.damjan.belabackend.game.events.PlayerLeftGameEvent;
import pro.damjan.belabackend.game.model.BeloteGame;
import pro.damjan.belabackend.game.model.GameStatus;
import pro.damjan.belabackend.game.model.config.GameConfiguration;
import pro.damjan.belabackend.game.model.player.GamePlayer;
import pro.damjan.belabackend.game.model.player.Team;
import pro.damjan.belabackend.game.model.player.TeamPair;
import pro.damjan.belabackend.game.service.access.GameAccessService;
import pro.damjan.belabackend.game.service.lifecycle.GameLifecycleService;
import pro.damjan.belabackend.game.service.lock.GameLockService;
import pro.damjan.belabackend.game.service.play.CardPlayService;
import pro.damjan.belabackend.game.service.play.TrumpPhaseService;
import pro.damjan.belabackend.redis.lock.InMemoryLockStore;
import pro.damjan.belabackend.redis.lock.ReentrantDistributedLock;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class BeloteGameServiceTest {

    private GameAccessService gameAccessService;
    private GameLifecycleService gameLifecycleService;
    private ApplicationEventPublisher applicationEventPublisher;
    private BeloteGameService beloteGameService;

    @BeforeEach
    void setUp() {
        gameAccessService = mock(GameAccessService.class);
        gameLifecycleService = mock(GameLifecycleService.class);
        applicationEventPublisher = mock(ApplicationEventPublisher.class);

        beloteGameService = new BeloteGameService(
                gameAccessService,
                gameLifecycleService,
                mock(TrumpPhaseService.class),
                mock(CardPlayService.class),
                new GameLockService(new ReentrantDistributedLock(new InMemoryLockStore())),
                applicationEventPublisher);
    }

    @Test
    void reportsTheScreenIsUpWhenTheGameIsThere() {
        when(gameAccessService.getUserGameId("user-id")).thenReturn("game-id");
        when(gameAccessService.findGameById("game-id"))
                .thenReturn(BeloteGame.builder().id("game-id").build());

        beloteGameService.onLoaded("user-id");

        verify(gameLifecycleService).onLoaded("user-id");
    }

    @Test
    void announcesALeaveWhenTheGameIsAlreadyGone() {
        // The lobby still names a dropped game, which is what sent the player here. Announcing
        // the leave is what resets that lobby, so the next snapshot stops routing them back.
        when(gameAccessService.getUserGameId("user-id")).thenReturn("dead-game-id");
        when(gameAccessService.findGameById("dead-game-id")).thenReturn(null);

        beloteGameService.onLoaded("user-id");

        verify(applicationEventPublisher).publishEvent(new PlayerLeftGameEvent("user-id"));
        verify(gameLifecycleService, never()).onLoaded(anyString());
    }

    @Test
    void announcesALeaveWhenThePlayerHasNoGameAtAll() {
        when(gameAccessService.getUserGameId("user-id")).thenReturn(null);

        beloteGameService.onLoaded("user-id");

        verify(applicationEventPublisher).publishEvent(new PlayerLeftGameEvent("user-id"));
        verify(gameLifecycleService, never()).onLoaded(anyString());
    }

    @Test
    void doesNotRefuseAPlayerWhoseGameVanished() {
        // Throwing is what trapped them: the screen gave up, went home, and home sent them back.
        when(gameAccessService.getUserGameId("user-id")).thenReturn("dead-game-id");
        when(gameAccessService.findGameById("dead-game-id")).thenReturn(null);

        assertThatCode(() -> beloteGameService.onLoaded("user-id")).doesNotThrowAnyException();
    }

    @Test
    void doesNotTearDownAGameThatIsStillThere() {
        when(gameAccessService.getUserGameId("user-id")).thenReturn("game-id");
        when(gameAccessService.findGameById("game-id"))
                .thenReturn(BeloteGame.builder().id("game-id").build());

        beloteGameService.onLoaded("user-id");

        verify(applicationEventPublisher, never()).publishEvent(any(PlayerLeftGameEvent.class));
    }

    @Test
    void leavingAFinishedGameStepsOffItAndAnnouncesTheLeave() {
        when(gameAccessService.getUserGameId("p0")).thenReturn("game-1");
        when(gameAccessService.findGameById("game-1")).thenReturn(game(GameStatus.FINISHED, List.of()));

        beloteGameService.leaveGame("p0");

        verify(gameLifecycleService).leaveFinishedGame("p0", "game-1");
        verify(applicationEventPublisher).publishEvent(new PlayerLeftGameEvent("p0"));
        verify(gameLifecycleService, never()).dropGame(anyString());
    }

    @Test
    void leavingAGameStillInProgressDropsItForEveryone() {
        // The sweeper already does this to a table the moment anyone goes quiet for thirty
        // seconds. Leaving on purpose only makes it immediate.
        when(gameAccessService.getUserGameId("p0")).thenReturn("game-1");
        when(gameAccessService.findGameById("game-1")).thenReturn(game(GameStatus.IN_PROGRESS, List.of()));

        beloteGameService.leaveGame("p0");

        verify(gameLifecycleService).dropGame("game-1");
        verify(applicationEventPublisher)
                .publishEvent(new GameAbandonedEvent("p0", List.of("p0", "p1", "p2", "p3")));
        verify(gameLifecycleService, never()).leaveFinishedGame(anyString(), anyString());
    }

    @Test
    void abandoningAGameOnlyNamesTheHumansAtTheTable() {
        // Bots have no lobby seat to be put back into, and naming them would send the listener
        // looking up a presence that has never existed.
        when(gameAccessService.getUserGameId("p0")).thenReturn("game-1");
        when(gameAccessService.findGameById("game-1"))
                .thenReturn(game(GameStatus.IN_PROGRESS, List.of(1, 2, 3)));

        beloteGameService.leaveGame("p0");

        verify(applicationEventPublisher).publishEvent(new GameAbandonedEvent("p0", List.of("p0")));
    }

    @Test
    void aGameThatIsAlreadyGoneStillAnnouncesAPlainLeave() {
        // The path that recovers a client stuck on a game nothing can find any more.
        when(gameAccessService.getUserGameId("p0")).thenReturn("dead-game-id");
        when(gameAccessService.findGameById("dead-game-id")).thenReturn(null);

        beloteGameService.leaveGame("p0");

        verify(applicationEventPublisher).publishEvent(new PlayerLeftGameEvent("p0"));
        verify(applicationEventPublisher, never()).publishEvent(any(GameAbandonedEvent.class));
    }

    private BeloteGame game(GameStatus status, List<Integer> botSeats) {
        List<GamePlayer> players = List.of(
                new GamePlayer("p0", 0, botSeats.contains(0)),
                new GamePlayer("p1", 1, botSeats.contains(1)),
                new GamePlayer("p2", 2, botSeats.contains(2)),
                new GamePlayer("p3", 3, botSeats.contains(3))
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
