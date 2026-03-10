package pro.damjan.belabackend.lobby.events.dto.outgoing;

import lombok.Getter;
import lombok.Setter;
import pro.damjan.belabackend.lobby.model.LobbyPlayerStatus;
import pro.damjan.belabackend.websocket.events.dto.OutgoingEvent;

@Getter @Setter
public class LobbyPlayerStatusChangeEvent extends OutgoingEvent {

    private String userId;
    private LobbyPlayerStatus status;

    public LobbyPlayerStatusChangeEvent(String userId, LobbyPlayerStatus status) {
        super("lobby:playerStatusChange");
        this.userId = userId;
        this.status = status;
    }
}

