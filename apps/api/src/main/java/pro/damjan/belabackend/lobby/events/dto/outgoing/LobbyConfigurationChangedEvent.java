package pro.damjan.belabackend.lobby.events.dto.outgoing;

import lombok.Getter;
import lombok.Setter;
import pro.damjan.belabackend.game.model.config.GameConfiguration;
import pro.damjan.belabackend.websocket.events.dto.OutgoingEvent;

@Getter
@Setter
public class LobbyConfigurationChangedEvent extends OutgoingEvent {

    private GameConfiguration configuration;

    public LobbyConfigurationChangedEvent(GameConfiguration configuration) {
        super("lobby:configChanged");
        this.configuration = configuration;
    }
}
