package pro.damjan.belabackend.lobby.events.dto.outgoing;

import lombok.Getter;
import lombok.Setter;
import pro.damjan.belabackend.websocket.events.dto.OutgoingEvent;

@Getter @Setter
public class LobbyHostChangedEvent extends OutgoingEvent {

    private String newHostId;

    public LobbyHostChangedEvent(String newHostId) {
        super("lobby:hostUpdated");
        this.newHostId = newHostId;
    }

}
