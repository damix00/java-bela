package pro.damjan.belabackend.game.events.dto.outgoing;

import lombok.Getter;
import lombok.Setter;
import pro.damjan.belabackend.game.model.BeloteGame;
import pro.damjan.belabackend.game.model.GameStatus;
import pro.damjan.belabackend.websocket.events.dto.OutgoingEvent;

@Getter @Setter
public class GameStatusUpdateEvent extends OutgoingEvent {

    private BeloteGame game;

    public GameStatusUpdateEvent(BeloteGame game) {
        super("game:statusUpdated");
        this.game = game;
    }

}
