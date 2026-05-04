package pro.damjan.belabackend.lobby.service;

import lombok.RequiredArgsConstructor;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Service;
import pro.damjan.belabackend.game.service.GameReconnectService;
import pro.damjan.belabackend.lobby.repository.LobbyRepository;
import pro.damjan.belabackend.lobby.events.LobbyEventPublisher;
import pro.damjan.belabackend.lobby.model.Lobby;
import pro.damjan.belabackend.user.presence.UserPresence;
import pro.damjan.belabackend.user.presence.UserPresenceService;
import pro.damjan.belabackend.user.presence.events.UserReconnectedEvent;
import pro.damjan.belabackend.user.presence.session.SessionService;

@Service
@RequiredArgsConstructor
public class LobbyReconnectService {

    private final UserPresenceService userPresenceService;
    private final LobbyRepository lobbyRepository;
    private final SessionService sessionService;
    private final LobbyEventPublisher lobbyEventPublisher;
    private final GameReconnectService gameReconnectService;

    @EventListener
    public void handleReconnect(UserReconnectedEvent event) throws InterruptedException {
        if (sessionService.getActiveSession(event.userId()) != null) return;

        UserPresence presence = userPresenceService.getUserPresence(event.userId());
        if (presence == null) return;

        String lobbyId = presence.getLobbyId();
        if (lobbyId == null) return;

        Lobby lobby = lobbyRepository.findById(lobbyId).orElse(null);
        if (lobby == null) {
            userPresenceService.cleanUpUser(event.userId());
            return;
        }

        sessionService.lockSession(event.sessionId());
        lobbyEventPublisher.sendSnapshot(lobby, event.userId());

        gameReconnectService.handleReconnect(event);
    }

}
