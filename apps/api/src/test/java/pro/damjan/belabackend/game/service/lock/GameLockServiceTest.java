package pro.damjan.belabackend.game.service.lock;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.concurrent.atomic.AtomicInteger;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class GameLockServiceTest {

    private GameLockService gameLockService;

    @BeforeEach
    void setUp() {
        gameLockService = new GameLockService();
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
}
