package pro.damjan.belabackend.lobby.events.dto.incoming;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import pro.damjan.belabackend.websocket.events.dto.IncomingEvent;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ChangeLobbyConfigCommand extends IncomingEvent {

    private String matchType;

    private int points;
}
