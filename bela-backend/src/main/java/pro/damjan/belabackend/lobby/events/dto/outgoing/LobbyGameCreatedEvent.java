package pro.damjan.belabackend.lobby.events.dto.outgoing;

import lombok.Getter;
import lombok.Setter;
import pro.damjan.belabackend.game.model.BeloteGame;
import pro.damjan.belabackend.lobby.model.Lobby;
import pro.damjan.belabackend.websocket.events.dto.OutgoingEvent;

@Getter @Setter
public class LobbyGameCreatedEvent extends OutgoingEvent {

    private Lobby lobby;
    private BeloteGame game;

    public LobbyGameCreatedEvent(Lobby lobby, BeloteGame game) {
        super("lobby:gameCreated");
        this.lobby = lobby;
        this.game = game;
    }
}
