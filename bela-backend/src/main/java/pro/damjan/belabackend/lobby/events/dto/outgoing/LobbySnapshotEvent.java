package pro.damjan.belabackend.lobby.events.dto.outgoing;

import lombok.Getter;
import lombok.Setter;
import pro.damjan.belabackend.lobby.model.Lobby;
import pro.damjan.belabackend.websocket.events.dto.OutgoingEvent;

/**
 * Sent to a user when they join a lobby, contains the full lobby snapshot.
 * Should only be sent once, when the user first joins, and not on subsequent updates to the lobby.
 */
@Getter @Setter
public class LobbySnapshotEvent extends OutgoingEvent {

    private Lobby lobby;

    public LobbySnapshotEvent(Lobby lobby) {
        super("lobby:snapshot");
        this.lobby = lobby;
    }
}
