package pro.damjan.belabackend.lobby.events.dto.incoming;

import lombok.Getter;
import lombok.RequiredArgsConstructor;
import pro.damjan.belabackend.lobby.model.Lobby;
import pro.damjan.belabackend.websocket.events.dto.IncomingEvent;

@RequiredArgsConstructor
public class LobbyReadyCommand extends IncomingEvent {

    @Getter
    private final boolean ready;
}
