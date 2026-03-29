package pro.damjan.belabackend.lobby.events.dto.outgoing;

import lombok.Getter;
import lombok.Setter;
import pro.damjan.belabackend.websocket.events.dto.OutgoingEvent;
import java.util.Map;

@Getter @Setter
public class LobbySeatsUpdatedEvent extends OutgoingEvent {

    Map<Integer, String> userSeats;

     public LobbySeatsUpdatedEvent(Map<Integer, String> userSeats) {
         super("lobby:seatsUpdated");
         this.userSeats = userSeats;
     }
}
