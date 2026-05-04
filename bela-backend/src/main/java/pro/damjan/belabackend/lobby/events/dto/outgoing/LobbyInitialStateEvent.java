package pro.damjan.belabackend.lobby.events.dto.outgoing;

import lombok.Getter;
import lombok.Setter;
import pro.damjan.belabackend.game.model.BeloteGame;
import pro.damjan.belabackend.lobby.model.Lobby;
import pro.damjan.belabackend.websocket.events.dto.OutgoingEvent;

/**
 * Sent to a user when they join a lobby, contains the full lobby snapshot.
 * Should only be sent once, when the user first joins, and not on subsequent updates to the lobby.
 */
@Getter @Setter
public class LobbyInitialStateEvent extends OutgoingEvent {

    private Lobby lobby;

    public LobbyInitialStateEvent(Lobby lobby) {
        super("lobby:initialState");
        this.lobby = lobby;
    }

}
