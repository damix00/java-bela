package pro.damjan.belabackend.websocket.events;

import lombok.Data;
import lombok.Getter;
import tools.jackson.databind.JsonNode;

@Data
public class IncomingWebSocketMessage {
    private String event;
    private JsonNode body;
}
