package pro.damjan.belabackend.lobby.ws.dto.outgoing;

import lombok.Getter;
import lombok.Setter;
import pro.damjan.belabackend.websocket.events.dto.OutgoingEvent;

@Getter @Setter
public class LobbyPlayerLeftEvent extends OutgoingEvent {

    private String userId;

    public LobbyPlayerLeftEvent(String userId) {
        super("lobbyPlayerLeft");
        this.userId = userId;
    }
}
