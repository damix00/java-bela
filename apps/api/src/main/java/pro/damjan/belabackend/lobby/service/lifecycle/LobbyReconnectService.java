package pro.damjan.belabackend.lobby.service.lifecycle;

import lombok.RequiredArgsConstructor;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Service;
import pro.damjan.belabackend.game.service.lifecycle.GameReconnectService;
import pro.damjan.belabackend.lobby.repository.LobbyRepository;
import pro.damjan.belabackend.lobby.events.LobbyEventPublisher;
import pro.damjan.belabackend.lobby.model.Lobby;
import pro.damjan.belabackend.user.presence.UserPresence;
import pro.damjan.belabackend.user.presence.UserPresenceService;
import pro.damjan.belabackend.user.presence.events.UserReconnectedEvent;
import pro.damjan.belabackend.user.presence.session.SessionTakeoverService;

@Service
@RequiredArgsConstructor
public class LobbyReconnectService {

    private final UserPresenceService userPresenceService;
    private final LobbyRepository lobbyRepository;
    private final SessionTakeoverService sessionTakeoverService;
    private final LobbyEventPublisher lobbyEventPublisher;
    private final GameReconnectService gameReconnectService;

    /**
     * Hands a returning player their table, on whichever connection they came back on.
     *
     * The newest connection wins outright: it takes the seat from any older session
     * of theirs and is sent the snapshot. It used to be the other way round — the
     * first session held the table and this stood down for it — which meant a
     * forgotten tab on another machine kept the player out of their own game.
     */
    @EventListener
    public void handleReconnect(UserReconnectedEvent event) throws InterruptedException {
        UserPresence presence = userPresenceService.getUserPresence(event.userId());
        if (presence == null) return;

        String lobbyId = presence.getLobbyId();
        if (lobbyId == null) return;

        Lobby lobby = lobbyRepository.findById(lobbyId).orElse(null);
        if (lobby == null) {
            userPresenceService.cleanUpUser(event.userId());
            return;
        }

        sessionTakeoverService.takeOver(event.userId(), event.sessionId());
        lobbyEventPublisher.sendSnapshot(lobby, event.userId());

        gameReconnectService.handleReconnect(event);
    }

}
