package pro.damjan.belabackend.game.events.dto.outgoing;

import lombok.Getter;
import lombok.Setter;
import pro.damjan.belabackend.websocket.events.dto.OutgoingEvent;

@Getter @Setter
public class PerspectiveOutgoingEvent extends OutgoingEvent {

    private String perspectiveUserId;

    public PerspectiveOutgoingEvent(String eventName) {
        super(eventName);
    }

    public PerspectiveOutgoingEvent(String eventName, String perspectiveUserId) {
        super(eventName);
        this.perspectiveUserId = perspectiveUserId;
    }
}
