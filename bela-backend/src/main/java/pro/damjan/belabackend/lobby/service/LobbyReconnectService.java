package pro.damjan.belabackend.lobby.service;

import lombok.RequiredArgsConstructor;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Service;
import pro.damjan.belabackend.game.model.BeloteGame;
import pro.damjan.belabackend.game.service.BeloteGameService;
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
    private final BeloteGameService beloteGameService;

    @EventListener
    public void handleReconnect(UserReconnectedEvent event) {
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
        reconnectToLobby(lobby, event.userId());
    }

    private void reconnectToLobby(Lobby lobby, String userId) {
        String gameId = lobby.getGameId();

        if (gameId != null) {
            BeloteGame game = beloteGameService.findGameById(gameId);
            if (game != null) {
                lobbyEventPublisher.sendSnapshot(lobby, game, userId);
                userPresenceService.setUserGame(userId, gameId);
                return;
            }
        }

        userPresenceService.setUserGame(userId, null);
        lobbyEventPublisher.sendSnapshot(lobby, userId);
    }


}
