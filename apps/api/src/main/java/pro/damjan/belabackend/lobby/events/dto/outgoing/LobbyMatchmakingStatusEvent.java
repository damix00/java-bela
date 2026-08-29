package pro.damjan.belabackend.lobby.events.dto.outgoing;

import lombok.Getter;
import lombok.Setter;
import pro.damjan.belabackend.lobby.model.LobbyStatus;
import pro.damjan.belabackend.websocket.events.dto.OutgoingEvent;

/**
 * Says whether a lobby is currently looking for opponents.
 *
 * A casual queue has no bots and no timeout, so a lobby can sit in it for as long as it takes.
 * Without this the players would ready up and then watch nothing happen, which reads as broken
 * rather than as waiting.
 *
 * Carries the whole status rather than a boolean so the client tracks one field instead of
 * reconciling two.
 */
@Getter
@Setter
public class LobbyMatchmakingStatusEvent extends OutgoingEvent {

    private LobbyStatus status;

    public LobbyMatchmakingStatusEvent(LobbyStatus status) {
        super("lobby:matchmakingStatus");
        this.status = status;
    }
}
