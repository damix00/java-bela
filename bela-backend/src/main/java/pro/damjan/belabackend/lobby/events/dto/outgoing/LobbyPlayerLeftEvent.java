package pro.damjan.belabackend.lobby.events.dto.outgoing;

import lombok.Getter;
import lombok.Setter;
import pro.damjan.belabackend.websocket.events.dto.OutgoingEvent;

@Getter @Setter
public class LobbyPlayerLeftEvent extends OutgoingEvent {

    private String userId;

    public LobbyPlayerLeftEvent(String userId) {
        super("lobby:playerLeft");
        this.userId = userId;
    }
}
