package pro.damjan.belabackend.lobby.ws.dto.outgoing;

import lombok.Getter;
import lombok.Setter;
import pro.damjan.belabackend.websocket.events.dto.OutgoingEvent;

@Getter @Setter
public class LobbyHostChangedEvent extends OutgoingEvent {

    private String newHostId;

    public LobbyHostChangedEvent(String newHostId) {
        super("lobbyHostUpdated");
        this.newHostId = newHostId;
    }

}
