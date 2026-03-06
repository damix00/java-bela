package pro.damjan.belabackend.lobby.ws.dto.outgoing;

import lombok.Getter;
import lombok.Setter;
import pro.damjan.belabackend.lobby.model.Lobby;
import pro.damjan.belabackend.websocket.events.OutgoingEvent;

@Getter @Setter
public class LobbyJoinedEvent extends OutgoingEvent {

    private Lobby lobby;

    public LobbyJoinedEvent(Lobby lobby) {
        super("lobbyJoined");
        this.lobby = lobby;
    }
}
