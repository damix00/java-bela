package pro.damjan.belabackend.lobby.service.lifecycle;

import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import pro.damjan.belabackend.game.service.lifecycle.GameEvictionService;
import pro.damjan.belabackend.lobby.model.LobbyStatus;
import pro.damjan.belabackend.lobby.repository.LobbyRepository;
import pro.damjan.belabackend.lobby.model.Lobby;
import pro.damjan.belabackend.lobby.model.LobbyPlayer;
import pro.damjan.belabackend.lobby.service.LobbyService;
import pro.damjan.belabackend.lobby.service.lock.LobbyLockService;
import pro.damjan.belabackend.redis.lock.DistributedLock;
import pro.damjan.belabackend.user.presence.UserPresenceService;

import java.time.Duration;
import java.util.List;

/**
 * Clears players out of lobbies once their presence has gone stale.
 *
 * Two locks, for two different problems. The sweep as a whole runs on one instance at a time,
 * because every instance schedules it and a scan that deletes lobbies is not something to run in
 * duplicate. Each lobby is then taken individually, because a player is meanwhile free to ready,
 * swap seats or leave on whichever instance holds their socket.
 */
@Service
@RequiredArgsConstructor
public class LobbyEvictionService {

    private static final String SWEEP_LOCK_KEY = "lobby:eviction:sweep";

    /**
     * Shorter than the interval on purpose. If a sweep dies holding the key, the next tick should
     * pick the work up rather than wait out a lease measured in minutes.
     */
    private static final Duration SWEEP_LEASE = Duration.ofSeconds(9);

    private final LobbyRepository lobbyRepository;
    private final UserPresenceService userPresenceService;
    private final LobbyService lobbyService;
    private final GameEvictionService gameEvictionService;
    private final LobbyLockService lobbyLockService;
    private final DistributedLock distributedLock;

    @Scheduled(fixedRate = 10_000) // Every 10 seconds
    public void evictOfflineLobbyPlayers() {
        // Losing the race is the ordinary case with more than one instance running, and means the
        // sweep is already happening elsewhere. Nothing to wait for, and nothing to report.
        distributedLock.tryWithLock(SWEEP_LOCK_KEY, SWEEP_LEASE, this::sweep);
    }

    private void sweep() {
        for (Lobby scanned : lobbyRepository.findAll()) {
            if (scanned == null) continue; // For some reason, the lobby can be null, skip it

            // findAll gave a snapshot. The lobby is read again under its own lock before anything
            // is decided, so an eviction is never based on seats that have since changed.
            lobbyLockService.withLobbyLock(scanned.getId(), () ->
                    lobbyRepository.findById(scanned.getId()).ifPresent(this::evictStalePlayers));
        }
    }

    private void evictStalePlayers(Lobby lobby) {
        List<LobbyPlayer> stalePlayerIds = lobby.getActivePlayers().stream()
                .filter(player -> {
                    if (player == null || player.isBot()) return false; // Skip null players and bots
                    return userPresenceService.isUserStale(player.getUserId());
                })
                .toList();

        if (stalePlayerIds.isEmpty()) return; // No stale players, skip eviction

        // Drop the current game
        if (lobby.getStatus() == LobbyStatus.IN_GAME) {
            gameEvictionService.dropGame(lobby.getGameId());
        }

        for (LobbyPlayer stalePlayer : stalePlayerIds) {
            lobbyService.evictPlayer(stalePlayer.getUserId(), lobby);
        }

        // Delete lobby if remaining players are only bots
        if (lobby.getActivePlayers().stream().allMatch(player -> player == null || player.isBot())) {
            lobbyRepository.delete(lobby);
        }
    }

}
