package pro.damjan.belabackend.lobby.service;

import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import pro.damjan.belabackend.lobby.repository.LobbyRepository;
import pro.damjan.belabackend.lobby.model.Lobby;
import pro.damjan.belabackend.lobby.model.LobbyPlayer;
import pro.damjan.belabackend.user.presence.UserPresenceService;

@Service
@RequiredArgsConstructor
public class LobbyEvictionService {

    private final LobbyRepository lobbyRepository;
    private final UserPresenceService userPresenceService;
    private final LobbyService lobbyService;

    @Scheduled(fixedRate = 10_000) // Every 10 seconds
    public void evictOfflineLobbyPlayers() {
        for (Lobby lobby : lobbyRepository.findAll()) {
            if (lobby == null) continue; // For some reason, the lobby can be null, skip it
            for (LobbyPlayer player : lobby.getActivePlayers()) {
                if (userPresenceService.isUserStale(player.getUserId())) {
                    System.out.println(player.getSeat() + " is stale, evicting from lobby " + lobby.getInviteCode());
                    lobbyService.evictPlayer(player.getUserId(), lobby);
                }
            }
        }
    }

}
