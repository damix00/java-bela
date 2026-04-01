package pro.damjan.belabackend.lobby.events.dto.outgoing;

import lombok.Getter;
import lombok.Setter;
import pro.damjan.belabackend.game.model.BeloteGame;
import pro.damjan.belabackend.websocket.events.dto.OutgoingEvent;

@Getter @Setter
public class LobbyGameCreatedEvent extends OutgoingEvent {

    private BeloteGame game;

    public LobbyGameCreatedEvent(BeloteGame game) {
        super("lobby:gameCreated");
        this.game = game;
    }
}
