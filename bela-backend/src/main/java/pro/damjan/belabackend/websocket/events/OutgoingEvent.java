package pro.damjan.belabackend.websocket.events;

import lombok.Getter;

public abstract class OutgoingEvent {

    @Getter
    private String eventName;

    public OutgoingEvent(String eventName) {
        this.eventName = eventName;
    }
}
