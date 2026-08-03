package pro.damjan.belabackend.websocket.events.dto;

import com.fasterxml.jackson.annotation.JsonIgnore;
import lombok.Getter;

public abstract class OutgoingEvent {

    @Getter
    @JsonIgnore
    private final String eventName;

    public OutgoingEvent(String eventName) {
        this.eventName = eventName;
    }
}
