package pro.damjan.belabackend.game.events.dto.outgoing;

import lombok.Getter;
import lombok.Setter;
import pro.damjan.belabackend.game.model.BeloteGame;
import pro.damjan.belabackend.websocket.events.dto.OutgoingEvent;

@Getter @Setter
public class GameSnapshotEvent extends OutgoingEvent {

    private BeloteGame game;

    public GameSnapshotEvent(BeloteGame game) {
        super("lobby:game:snapshot");
        this.game = game;
    }
}
