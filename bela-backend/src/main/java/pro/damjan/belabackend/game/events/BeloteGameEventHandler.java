package pro.damjan.belabackend.game.events;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import pro.damjan.belabackend.game.events.dto.incoming.ChooseTrumpCommand;
import pro.damjan.belabackend.game.service.BeloteGameService;
import pro.damjan.belabackend.user.User;
import pro.damjan.belabackend.websocket.events.OnEvent;

@Component
@RequiredArgsConstructor
public class BeloteGameEventHandler {

    private final BeloteGameService beloteGameService;

    @OnEvent("game:loaded")
    public void onGameLoaded(User user) {
        beloteGameService.onLoaded(user.getId());
    }

    @OnEvent("game:trump:choose")
    public void chooseTrump(User user, ChooseTrumpCommand command) {
        beloteGameService.chooseTrump(user.getId(), command.getSuite());
    }

    @OnEvent("game:trump:pass")
    public void passTrump(User user) {
        beloteGameService.passTrump(user.getId());
    }
}
