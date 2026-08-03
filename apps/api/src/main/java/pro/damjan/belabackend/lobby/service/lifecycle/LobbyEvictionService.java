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
import pro.damjan.belabackend.user.presence.UserPresenceService;

import java.util.List;

@Service
@RequiredArgsConstructor
public class LobbyEvictionService {

    private final LobbyRepository lobbyRepository;
    private final UserPresenceService userPresenceService;
    private final LobbyService lobbyService;
    private final GameEvictionService gameEvictionService;

    @Scheduled(fixedRate = 10_000) // Every 10 seconds
    public void evictOfflineLobbyPlayers() {
        for (Lobby lobby : lobbyRepository.findAll()) {
            if (lobby == null) continue; // For some reason, the lobby can be null, skip it

            List<LobbyPlayer> stalePlayerIds = lobby.getActivePlayers().stream()
                    .filter(player -> {
                        if (player == null || player.isBot()) return false; // Skip null players and bots
                        return userPresenceService.isUserStale(player.getUserId());
                    })
                    .toList();

            if (stalePlayerIds.isEmpty()) continue; // No stale players, skip eviction

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

}
