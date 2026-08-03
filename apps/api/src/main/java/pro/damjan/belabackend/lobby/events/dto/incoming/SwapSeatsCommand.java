package pro.damjan.belabackend.lobby.events.dto.incoming;

import lombok.Getter;
import lombok.RequiredArgsConstructor;
import pro.damjan.belabackend.websocket.events.dto.IncomingEvent;

@RequiredArgsConstructor
public class SwapSeatsCommand extends IncomingEvent {

    @Getter
    private final int seat;
}
