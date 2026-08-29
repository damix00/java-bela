package pro.damjan.belabackend.redis.lock;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.Duration;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicReference;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class ReentrantDistributedLockTest {

    private static final Duration LEASE = Duration.ofSeconds(5);
    private static final Duration WAIT = Duration.ofSeconds(2);

    private InMemoryLockStore lockStore;
    private ReentrantDistributedLock lock;

    @BeforeEach
    void setUp() {
        lockStore = new InMemoryLockStore();
        lock = new ReentrantDistributedLock(lockStore);
    }

    @Test
    void runsTheActionAndReturnsItsValue() {
        String result = lock.withLock("key", LEASE, WAIT, () -> "done");

        assertThat(result).isEqualTo("done");
    }

    @Test
    void releasesTheLockAfterwards() {
        lock.withLock("key", LEASE, WAIT, () -> "done");

        assertThat(lockStore.isHeld("key")).isFalse();
    }

    @Test
    void releasesTheLockWhenTheActionThrows() {
        assertThatThrownBy(() -> lock.withLock("key", LEASE, WAIT, () -> {
            throw new IllegalStateException("boom");
        })).isInstanceOf(IllegalStateException.class);

        assertThat(lockStore.isHeld("key")).isFalse();
    }

    @Test
    void aThreadMayReEnterALockItAlreadyHolds() {
        AtomicInteger calls = new AtomicInteger();

        lock.withLock("key", LEASE, WAIT, () ->
                lock.withLock("key", LEASE, WAIT, calls::incrementAndGet));

        assertThat(calls).hasValue(1);
        assertThat(lockStore.isHeld("key")).isFalse();
    }

    @Test
    void anInnerSectionDoesNotReleaseTheLockTheOuterOneHolds() {
        AtomicBoolean heldAfterInner = new AtomicBoolean();

        lock.withLock("key", LEASE, WAIT, () -> {
            lock.withLock("key", LEASE, WAIT, () -> null);
            heldAfterInner.set(lockStore.isHeld("key"));
            return null;
        });

        assertThat(heldAfterInner).isTrue();
    }

    @Test
    void excludesAnotherThreadWhileHeld() throws Exception {
        CountDownLatch acquired = new CountDownLatch(1);
        CountDownLatch release = new CountDownLatch(1);
        AtomicReference<Throwable> failure = new AtomicReference<>();

        Thread holder = new Thread(() -> lock.withLock("key", LEASE, WAIT, () -> {
            acquired.countDown();
            try {
                release.await(5, TimeUnit.SECONDS);
            } catch (InterruptedException interrupted) {
                Thread.currentThread().interrupt();
            }
            return null;
        }));
        holder.start();

        assertThat(acquired.await(5, TimeUnit.SECONDS)).isTrue();

        Thread contender = new Thread(() -> {
            try {
                lock.withLock("key", LEASE, Duration.ofMillis(200), () -> null);
            } catch (Throwable thrown) {
                failure.set(thrown);
            }
        });
        contender.start();
        contender.join(5_000);

        assertThat(failure.get()).isInstanceOf(LockAcquisitionException.class);

        release.countDown();
        holder.join(5_000);
    }

    @Test
    void aDifferentKeyIsNotBlocked() throws Exception {
        CountDownLatch acquired = new CountDownLatch(1);
        CountDownLatch release = new CountDownLatch(1);

        Thread holder = new Thread(() -> lock.withLock("key-a", LEASE, WAIT, () -> {
            acquired.countDown();
            try {
                release.await(5, TimeUnit.SECONDS);
            } catch (InterruptedException interrupted) {
                Thread.currentThread().interrupt();
            }
            return null;
        }));
        holder.start();

        assertThat(acquired.await(5, TimeUnit.SECONDS)).isTrue();
        assertThat(lock.withLock("key-b", LEASE, WAIT, () -> "b")).isEqualTo("b");

        release.countDown();
        holder.join(5_000);
    }

    @Test
    void waitsForAnExpiredLeaseRatherThanFailing() {
        // A holder that died without releasing leaves the key set; the lease is what frees it.
        lockStore.tryAcquire("key", "dead-holder", Duration.ofMillis(50));

        assertThat(lock.withLock("key", LEASE, WAIT, () -> "taken")).isEqualTo("taken");
    }

    @Test
    void doesNotReleaseALockItNoLongerOwns() {
        // The lease expires mid-section and another instance takes the key. When the original
        // section ends it must not delete the new holder's lock.
        lock.withLock("key", Duration.ofMillis(50), WAIT, () -> {
            try {
                Thread.sleep(120);
            } catch (InterruptedException interrupted) {
                Thread.currentThread().interrupt();
            }
            lockStore.tryAcquire("key", "other-instance", LEASE);
            return null;
        });

        assertThat(lockStore.isHeld("key")).isTrue();
    }

    @Test
    void rejectsABlankKey() {
        assertThatThrownBy(() -> lock.withLock(" ", LEASE, WAIT, () -> null))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("Lock key must not be blank");
    }

    @Test
    void tryRunsTheActionAndReportsThatItDid() {
        AtomicInteger calls = new AtomicInteger();

        assertThat(lock.tryWithLock("key", LEASE, calls::incrementAndGet)).isTrue();
        assertThat(calls).hasValue(1);
    }

    @Test
    void tryReleasesTheLockAfterwards() {
        lock.tryWithLock("key", LEASE, () -> {});

        assertThat(lockStore.isHeld("key")).isFalse();
    }

    @Test
    void tryReleasesTheLockWhenTheActionThrows() {
        assertThatThrownBy(() -> lock.tryWithLock("key", LEASE, () -> {
            throw new IllegalStateException("boom");
        })).isInstanceOf(IllegalStateException.class);

        assertThat(lockStore.isHeld("key")).isFalse();
    }

    @Test
    void trySkipsTheActionWhenAnotherHolderHasTheKey() throws Exception {
        // The sweeper's case: another instance is already doing this work, so the right outcome is
        // to decline and move on rather than wait or raise.
        CountDownLatch acquired = new CountDownLatch(1);
        CountDownLatch release = new CountDownLatch(1);
        AtomicInteger calls = new AtomicInteger();
        AtomicBoolean ran = new AtomicBoolean(true);

        Thread holder = new Thread(() -> lock.withLock("key", LEASE, WAIT, () -> {
            acquired.countDown();
            try {
                release.await(5, TimeUnit.SECONDS);
            } catch (InterruptedException interrupted) {
                Thread.currentThread().interrupt();
            }
            return null;
        }));
        holder.start();

        assertThat(acquired.await(5, TimeUnit.SECONDS)).isTrue();

        Thread contender = new Thread(() ->
                ran.set(lock.tryWithLock("key", LEASE, calls::incrementAndGet)));
        contender.start();
        contender.join(5_000);

        assertThat(ran).isFalse();
        assertThat(calls).hasValue(0);

        release.countDown();
        holder.join(5_000);
    }

    @Test
    void tryDoesNotDeclineALockThisThreadAlreadyHolds() {
        // Reentering is not contention: the work is this call stack's own, not a duplicate of
        // somebody else's, so there is nothing to skip.
        AtomicInteger calls = new AtomicInteger();
        AtomicBoolean ran = new AtomicBoolean();

        lock.withLock("key", LEASE, WAIT, () -> {
            ran.set(lock.tryWithLock("key", LEASE, calls::incrementAndGet));
            return null;
        });

        assertThat(ran).isTrue();
        assertThat(calls).hasValue(1);
    }

    @Test
    void tryLeavesAnOuterSectionHoldingItsLock() {
        AtomicBoolean heldAfterInner = new AtomicBoolean();

        lock.withLock("key", LEASE, WAIT, () -> {
            lock.tryWithLock("key", LEASE, () -> {});
            heldAfterInner.set(lockStore.isHeld("key"));
            return null;
        });

        assertThat(heldAfterInner).isTrue();
    }

    @Test
    void tryRejectsABlankKey() {
        assertThatThrownBy(() -> lock.tryWithLock(" ", LEASE, () -> {}))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("Lock key must not be blank");
    }
}
