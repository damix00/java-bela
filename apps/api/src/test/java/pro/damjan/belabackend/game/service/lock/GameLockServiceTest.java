package pro.damjan.belabackend.game.service.lock;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import pro.damjan.belabackend.redis.lock.InMemoryLockStore;
import pro.damjan.belabackend.redis.lock.ReentrantDistributedLock;

import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.atomic.AtomicInteger;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class GameLockServiceTest {

    private InMemoryLockStore lockStore;
    private GameLockService gameLockService;

    @BeforeEach
    void setUp() {
        lockStore = new InMemoryLockStore();
        gameLockService = new GameLockService(new ReentrantDistributedLock(lockStore));
    }

    @Test
    void runsActionInsideGameLock() {
        AtomicInteger calls = new AtomicInteger();

        gameLockService.withGameLock("game-1", calls::incrementAndGet);

        assertThat(calls).hasValue(1);
    }

    @Test
    void allowsReentrantGameLockOnSameThread() {
        AtomicInteger calls = new AtomicInteger();

        gameLockService.withGameLock("game-1", () ->
                gameLockService.withGameLock("game-1", calls::incrementAndGet)
        );

        assertThat(calls).hasValue(1);
    }

    @Test
    void rejectsMissingGameId() {
        assertThatThrownBy(() -> gameLockService.withGameLock(" ", () -> {}))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("Game id is required for locking");
    }

    @Test
    void namespacesTheKeySoGamesCannotCollideWithOtherLocks() {
        AtomicBoolean heldDuring = new AtomicBoolean();

        gameLockService.withGameLock("game-1", () -> heldDuring.set(lockStore.isHeld("game:lock:game-1")));

        assertThat(heldDuring).isTrue();
    }

    @Test
    void releasesTheLockAfterTheAction() {
        gameLockService.withGameLock("game-1", () -> {});

        assertThat(lockStore.isHeld("game:lock:game-1")).isFalse();
    }
}
