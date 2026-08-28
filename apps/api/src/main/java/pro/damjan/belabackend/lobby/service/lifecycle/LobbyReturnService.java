package pro.damjan.belabackend.lobby.service.lifecycle;

import lombok.RequiredArgsConstructor;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Service;
import pro.damjan.belabackend.game.events.PlayerLeftGameEvent;
import pro.damjan.belabackend.lobby.model.Lobby;
import pro.damjan.belabackend.lobby.repository.LobbyRepository;
import pro.damjan.belabackend.lobby.service.LobbyService;
import pro.damjan.belabackend.user.presence.UserPresence;
import pro.damjan.belabackend.user.presence.UserPresenceService;

/**
 * The lobby half of the "back to lobby" flow.
 *
 * Listening rather than being called keeps the dependency pointing lobby to game, the way the rest
 * of the codebase already does — see {@link LobbyReconnectService} for the same shape.
 */
@Service
@RequiredArgsConstructor
public class LobbyReturnService {

    private final UserPresenceService userPresenceService;
    private final LobbyRepository lobbyRepository;
    private final LobbyService lobbyService;

    @EventListener
    public void handlePlayerLeftGame(PlayerLeftGameEvent event) {
        UserPresence presence = userPresenceService.getUserPresence(event.userId());
        if (presence == null || presence.getLobbyId() == null) return;

        Lobby lobby = lobbyRepository.findById(presence.getLobbyId()).orElse(null);
        if (lobby == null) {
            userPresenceService.cleanUpUser(event.userId());
            return;
        }

        lobbyService.returnToLobby(lobby, event.userId());
    }

}
