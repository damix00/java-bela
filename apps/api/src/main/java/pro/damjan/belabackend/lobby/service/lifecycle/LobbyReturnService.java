package pro.damjan.belabackend.lobby.service.lifecycle;

import lombok.RequiredArgsConstructor;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Service;
import pro.damjan.belabackend.game.events.GameAbandonedEvent;
import pro.damjan.belabackend.game.events.PlayerLeftGameEvent;
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
    private final LobbyService lobbyService;

    @EventListener
    public void handlePlayerLeftGame(PlayerLeftGameEvent event) {
        UserPresence presence = userPresenceService.getUserPresence(event.userId());
        if (presence == null || presence.getLobbyId() == null) return;

        // Only the id is resolved here. Loading the lobby is left to returnToLobby, which does it
        // under the lobby's lock along with the reset it may then write.
        lobbyService.returnToLobby(presence.getLobbyId(), event.userId());
    }

    /**
     * The same flow for a game somebody walked out of before it finished.
     *
     * Two differences from the one above. Everybody is handed back at once rather than as each of
     * them asks for it — the game is already gone, and the other three are otherwise left watching a
     * table that has stopped moving. And the leaver is taken out of their table rather than put back
     * at it, because sitting straight back down with the three people whose game you just ended is
     * not what leaving means.
     *
     * Each player's lobby is resolved from their own presence rather than assumed shared. A
     * matchmade table is built out of up to four separate lobbies, and returning those players to
     * the leaver's would seat them somewhere they have never been.
     */
    @EventListener
    public void handleGameAbandoned(GameAbandonedEvent event) {
        for (String userId : event.humanUserIds()) {
            if (userId.equals(event.leaverId())) continue;

            UserPresence presence = userPresenceService.getUserPresence(userId);
            if (presence == null || presence.getLobbyId() == null) continue;

            lobbyService.returnToLobby(presence.getLobbyId(), userId);
        }

        UserPresence leaver = userPresenceService.getUserPresence(event.leaverId());
        if (leaver == null || leaver.getLobbyId() == null) {
            userPresenceService.cleanUpUser(event.leaverId());
            return;
        }

        lobbyService.leaveAbandonedLobby(leaver.getLobbyId(), event.leaverId());
    }

}
