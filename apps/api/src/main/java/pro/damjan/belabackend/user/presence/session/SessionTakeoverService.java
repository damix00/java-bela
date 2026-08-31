package pro.damjan.belabackend.user.presence.session;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import pro.damjan.belabackend.user.presence.session.events.dto.outgoing.SessionSupersededEvent;
import pro.damjan.belabackend.websocket.events.WebSocketPublisher;

@Service
@RequiredArgsConstructor
public class SessionTakeoverService {

    private final SessionService sessionService;
    private final WebSocketPublisher webSocketPublisher;

    /**
     * Hands the player's seat to the session that just asked for it.
     *
     * The newest connection wins, always. A player who left a tab open on their
     * laptop and then opened the game on their phone is the same player, and
     * the phone is where they are looking — refusing it, which is what this
     * replaced, locked people out of their own table until they went back and
     * closed the window they had walked away from.
     *
     * Every other session of theirs is stood down and told so on its own
     * channel, so the abandoned window can say what happened instead of sitting
     * on a table that has quietly stopped answering.
     */
    public void takeOver(String userId, String newSessionId) {
        for (UserSession superseded : sessionService.deactivateOtherSessions(userId, newSessionId)) {
            webSocketPublisher.sendToUserSession(userId, superseded.getId(), new SessionSupersededEvent());
        }

        sessionService.lockSession(newSessionId);
    }

}
