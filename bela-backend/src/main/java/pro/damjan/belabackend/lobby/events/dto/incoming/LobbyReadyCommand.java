package pro.damjan.belabackend.lobby.events.dto.incoming;

import lombok.Getter;
import pro.damjan.belabackend.lobby.model.Lobby;
import pro.damjan.belabackend.websocket.events.dto.IncomingEvent;

public class LobbyReadyCommand extends IncomingEvent {
    @Getter
    private final boolean ready;

    public LobbyReadyCommand(boolean ready) {
        this.ready = ready;
    }
}
