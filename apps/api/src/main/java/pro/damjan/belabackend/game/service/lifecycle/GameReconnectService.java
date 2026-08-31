package pro.damjan.belabackend.game.service.lifecycle;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import pro.damjan.belabackend.game.events.BeloteGameEventPublisher;
import pro.damjan.belabackend.game.model.BeloteGame;
import pro.damjan.belabackend.game.model.GameStatus;
import pro.damjan.belabackend.game.service.BeloteGameService;
import pro.damjan.belabackend.user.presence.UserPresence;
import pro.damjan.belabackend.user.presence.UserPresenceService;
import pro.damjan.belabackend.user.presence.events.UserReconnectedEvent;
import pro.damjan.belabackend.user.presence.session.SessionService;
import pro.damjan.belabackend.user.presence.session.UserSession;

@Service
@RequiredArgsConstructor
public class GameReconnectService {

    private final UserPresenceService userPresenceService;
    private final SessionService sessionService;
    private final BeloteGameService beloteGameService;
    private final BeloteGameEventPublisher beloteGameEventPublisher;

    public void handleReconnect(UserReconnectedEvent event) {
        // LobbyReconnectService has already handed the seat to this session. Anything else
        // means a newer connection took it in between, and the snapshot belongs to that one.
        UserSession activeSession = sessionService.getActiveSession(event.userId());
        if (activeSession == null || !activeSession.getId().equals(event.sessionId())) return;

        UserPresence presence = userPresenceService.getUserPresence(event.userId());
        if (presence == null) return;

        String gameId = presence.getGameId();
        if (gameId == null) return;

        BeloteGame game = beloteGameService.findGameById(gameId);
        if (game == null) {
            userPresenceService.cancelUserGame(event.userId());
            return;
        }

        // The game is over — there is nothing to rejoin. Treat the reconnect as the leave they never
        // got to send, which hands them back to their lobby and drops the game once the last one is out.
        if (game.getStatus() == GameStatus.FINISHED) {
            beloteGameService.leaveGame(event.userId());
            return;
        }

        beloteGameEventPublisher.sendSnapshot(game, event.userId());
    }

}
