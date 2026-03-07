package pro.damjan.belabackend.lobby.ws.dto.outgoing;

import lombok.Getter;
import lombok.Setter;
import pro.damjan.belabackend.lobby.model.Lobby;
import pro.damjan.belabackend.websocket.events.dto.OutgoingEvent;

/**
 * Sent to a user when they join a lobby, contains the full lobby snapshot.
 */
@Getter @Setter
public class LobbySnapshotEvent extends OutgoingEvent {

    private Lobby lobby;

    public LobbySnapshotEvent(Lobby lobby) {
        super("lobbySnapshot");
        this.lobby = lobby;
    }
}
