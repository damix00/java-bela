package pro.damjan.belabackend.websocket.events.dto;

import lombok.Getter;

public abstract class OutgoingEvent {

    @Getter
    private final String eventName;

    public OutgoingEvent(String eventName) {
        this.eventName = eventName;
    }
}
