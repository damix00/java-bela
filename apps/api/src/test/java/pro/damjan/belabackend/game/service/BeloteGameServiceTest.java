package pro.damjan.belabackend.game.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.context.ApplicationEventPublisher;
import pro.damjan.belabackend.game.events.PlayerLeftGameEvent;
import pro.damjan.belabackend.game.model.BeloteGame;
import pro.damjan.belabackend.game.service.access.GameAccessService;
import pro.damjan.belabackend.game.service.lifecycle.GameLifecycleService;
import pro.damjan.belabackend.game.service.lock.GameLockService;
import pro.damjan.belabackend.game.service.play.CardPlayService;
import pro.damjan.belabackend.game.service.play.TrumpPhaseService;
import pro.damjan.belabackend.redis.lock.InMemoryLockStore;
import pro.damjan.belabackend.redis.lock.ReentrantDistributedLock;

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
}
