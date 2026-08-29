package pro.damjan.belabackend.lobby.service.lock;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import pro.damjan.belabackend.redis.lock.DistributedLock;

import java.time.Duration;
import java.util.function.Supplier;

/**
 * Serialises work on a single lobby.
 *
 * A lobby is a seat map that every operation reads, changes and writes back, and until now nothing
 * excluded two of those from overlapping — not even within one JVM. Two players taking the last
 * two seats, or one swapping seats while another readies, could each save a copy built from the
 * same starting state, and whichever wrote second silently discarded the other's change. A second
 * instance widens that window rather than creating it.
 *
 * The lock has to be taken before the lobby is read, not after: loading first and locking second
 * leaves the read outside the section it was meant to protect, which is the bug this exists to
 * stop. Callers therefore resolve a lobby id, lock on it, and load inside.
 *
 * Where a section also needs a game lock, the lobby is taken first. That ordering is the one the
 * codebase already runs in — the dependency points lobby to game and never back — so holding to it
 * keeps two instances from meeting head-on. See {@code GameLockService}, which this mirrors.
 */
@Service
@RequiredArgsConstructor
public class LobbyLockService {

    /**
     * Long enough for the slowest section, which spans Redis reads, the mutation, matchmaking and
     * the WebSocket publishes that follow. A section that outran the lease would let a second
     * holder in, so keep sections short rather than raising this.
     */
    private static final Duration LEASE = Duration.ofSeconds(10);
    private static final Duration WAIT = Duration.ofSeconds(10);
    private static final String KEY_PREFIX = "lobby:lock:";

    private final DistributedLock distributedLock;

    public void withLobbyLock(String lobbyId, Runnable action) {
        withLobbyLock(lobbyId, () -> {
            action.run();
            return null;
        });
    }

    public <T> T withLobbyLock(String lobbyId, Supplier<T> action) {
        if (lobbyId == null || lobbyId.isBlank()) {
            throw new IllegalArgumentException("Lobby id is required for locking");
        }

        return distributedLock.withLock(KEY_PREFIX + lobbyId, LEASE, WAIT, action);
    }
}
