package pro.damjan.belabackend.lobby.connection;

import lombok.RequiredArgsConstructor;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Service;
import pro.damjan.belabackend.lobby.LobbyRepository;
import pro.damjan.belabackend.lobby.events.LobbyEventPublisher;
import pro.damjan.belabackend.lobby.model.Lobby;
import pro.damjan.belabackend.user.presence.UserPresence;
import pro.damjan.belabackend.user.presence.UserPresenceService;
import pro.damjan.belabackend.user.presence.events.UserReconnectedEvent;
import pro.damjan.belabackend.user.presence.session.SessionService;

@Service
@RequiredArgsConstructor
public class LobbyPresenceService {

    private final UserPresenceService userPresenceService;
    private final LobbyRepository lobbyRepository;
    private final SessionService sessionService;
    private final LobbyEventPublisher lobbyEventPublisher;

    @EventListener
    public void handleReconnect(UserReconnectedEvent event) {
        UserPresence userPresence = userPresenceService.getUserPresence(event.userId());
        String lobbyId = userPresence != null ? userPresence.getLobbyId() : null;
        if (lobbyId != null) {
            Lobby lobby = lobbyRepository.findById(lobbyId).orElse(null);
            if (lobby != null) {
                sessionService.lockSession(event.sessionId());
                lobbyEventPublisher.sendSnapshot(lobby, event.userId());
            } else {
                userPresenceService.cleanUpUser(event.userId());
            }
        }
    }


}
