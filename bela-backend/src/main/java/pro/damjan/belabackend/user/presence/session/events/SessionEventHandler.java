package pro.damjan.belabackend.user.presence.session.events;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import pro.damjan.belabackend.user.presence.UserPresenceService;
import pro.damjan.belabackend.user.presence.session.SessionService;
import pro.damjan.belabackend.user.presence.session.UserSession;
import pro.damjan.belabackend.websocket.events.OnEvent;

@Component
@RequiredArgsConstructor
public class SessionEventHandler {
    private final SessionService sessionService;
    private final UserPresenceService userPresenceService;

    @OnEvent("session:keep-alive")
    public void handleKeepAlive(UserSession session) {
        sessionService.keepAlive(session.getId());
        userPresenceService.presenceKeepAlive(session.getUserId());
    }
}
