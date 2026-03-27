package pro.damjan.belabackend.lobby.connection;

import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import pro.damjan.belabackend.lobby.LobbyRepository;
import pro.damjan.belabackend.lobby.LobbyService;
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
            for (LobbyPlayer player : lobby.getNonNullPlayers()) {
                if (!userPresenceService.isUserOnline(player.getUserId())) {
                    lobbyService.leaveLobby(player.getUserId());
                }
            }
        }
    }

}
