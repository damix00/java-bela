package pro.damjan.belabackend.game.events.dto.incoming;

import lombok.Getter;
import lombok.Setter;
import pro.damjan.belabackend.game.model.card.Suite;
import pro.damjan.belabackend.websocket.events.dto.IncomingEvent;

@Getter @Setter
public class ChooseTrumpCommand extends IncomingEvent {

    private Suite suite;

    public ChooseTrumpCommand() {}
}
