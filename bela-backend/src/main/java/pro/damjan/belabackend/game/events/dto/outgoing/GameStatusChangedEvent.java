package pro.damjan.belabackend.game.events.dto.outgoing;

import lombok.Getter;
import lombok.Setter;
import pro.damjan.belabackend.game.model.GameStatus;
import pro.damjan.belabackend.websocket.events.dto.OutgoingEvent;

import java.io.Serializable;

@Getter @Setter
public class GameStatusChangedEvent extends OutgoingEvent implements Serializable {

    private final GameStatus gameStatus;

    public GameStatusChangedEvent(GameStatus gameStatus) {
        super("game:statusChanged");
        this.gameStatus = gameStatus;
    }
}
