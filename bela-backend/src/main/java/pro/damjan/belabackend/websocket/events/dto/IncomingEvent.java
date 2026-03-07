package pro.damjan.belabackend.websocket.events.dto;

import lombok.Getter;

public abstract class IncomingEvent {

    @Getter
    private final String eventName;

    public IncomingEvent(String eventName) {
        this.eventName = eventName;
    }

}
