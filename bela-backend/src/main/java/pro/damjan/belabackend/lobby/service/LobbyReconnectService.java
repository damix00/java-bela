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
import pro.damjan.belabackend.user.presence.session.UserSession;

@Service
@RequiredArgsConstructor
public class LobbyReconnectService {

    private final UserPresenceService userPresenceService;
    private final LobbyRepository lobbyRepository;
    private final SessionService sessionService;
    private final LobbyEventPublisher lobbyEventPublisher;
    private final GameReconnectService gameReconnectService;

    @EventListener
    public void handleReconnect(UserReconnectedEvent event) {
        UserPresence userPresence = userPresenceService.getUserPresence(event.userId());
        UserSession session = sessionService.getActiveSession(event.userId());
        if (session != null) {
            return;
        }
        String lobbyId = userPresence != null ? userPresence.getLobbyId() : null;
        if (lobbyId != null) {
            Lobby lobby = lobbyRepository.findById(lobbyId).orElse(null);
            if (lobby != null) {
                sessionService.lockSession(event.sessionId());
                lobbyEventPublisher.sendSnapshot(lobby, event.userId());

                String gameId = lobby.getGameId();
                if (gameId != null) {
                    gameReconnectService.handleReconnect(event, userPresence, gameId);
                }
            } else {
                userPresenceService.cleanUpUser(event.userId());
            }
        }
    }


}
