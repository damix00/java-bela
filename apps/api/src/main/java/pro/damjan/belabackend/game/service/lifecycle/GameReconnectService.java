package pro.damjan.belabackend.game.service.lifecycle;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import pro.damjan.belabackend.game.events.BeloteGameEventPublisher;
import pro.damjan.belabackend.game.model.BeloteGame;
import pro.damjan.belabackend.game.service.BeloteGameService;
import pro.damjan.belabackend.user.presence.UserPresence;
import pro.damjan.belabackend.user.presence.UserPresenceService;
import pro.damjan.belabackend.user.presence.events.UserReconnectedEvent;
import pro.damjan.belabackend.user.presence.session.SessionService;

@Service
@RequiredArgsConstructor
public class GameReconnectService {

    private final UserPresenceService userPresenceService;
    private final SessionService sessionService;
    private final BeloteGameService beloteGameService;
    private final BeloteGameEventPublisher beloteGameEventPublisher;

    public void handleReconnect(UserReconnectedEvent event) {
        // Session must already be locked by LobbyReconnectService
        if (sessionService.getActiveSession(event.userId()) == null) return;

        UserPresence presence = userPresenceService.getUserPresence(event.userId());
        if (presence == null) return;

        String gameId = presence.getGameId();
        if (gameId == null) return;

        BeloteGame game = beloteGameService.findGameById(gameId);
        if (game == null) {
            userPresenceService.cancelUserGame(event.userId());
            return;
        }

        beloteGameEventPublisher.sendSnapshot(game, event.userId());
    }

}
