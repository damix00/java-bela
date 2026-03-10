package pro.damjan.belabackend.lobby.events.dto.outgoing;

import lombok.Getter;
import lombok.Setter;
import pro.damjan.belabackend.lobby.model.LobbyPlayer;
import pro.damjan.belabackend.websocket.events.dto.OutgoingEvent;

/**
 * Broadcast to all players in the lobby when a new player joins.
 */
@Getter @Setter
public class LobbyPlayerJoinedEvent extends OutgoingEvent {

    private LobbyPlayer player;

    public LobbyPlayerJoinedEvent(LobbyPlayer player) {
        super("lobby:playerJoined");
        this.player = player;
    }
}
