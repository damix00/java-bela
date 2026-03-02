package pro.damjan.belabackend.lobby.model;

import lombok.Getter;
import lombok.Setter;

import java.io.Serializable;

@Getter @Setter
public class LobbyPlayer implements Serializable {

    private String userId;
    private boolean isHost;
    private LobbyPlayerStatus status;

    public LobbyPlayer(String userId, boolean isHost, LobbyPlayerStatus status) {
        this.userId = userId;
        this.isHost = isHost;
        this.status = status;
    }

}
