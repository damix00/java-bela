package pro.damjan.belabackend.game.events;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import pro.damjan.belabackend.game.service.BeloteGameService;
import pro.damjan.belabackend.user.User;
import pro.damjan.belabackend.user.presence.session.UserSession;
import pro.damjan.belabackend.websocket.events.OnEvent;

@Component
@RequiredArgsConstructor
public class BeloteGameEventHandler {

    private final BeloteGameService beloteGameService;

    @OnEvent("game:loaded")
    public void onGameLoaded(User user) {
        beloteGameService.onLoaded(user.getId());
    }
}
