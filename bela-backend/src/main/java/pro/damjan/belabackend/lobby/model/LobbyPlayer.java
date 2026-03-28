package pro.damjan.belabackend.lobby.model;

import lombok.Getter;
import lombok.RequiredArgsConstructor;
import lombok.Setter;

import java.io.Serializable;
import java.time.Instant;

@Getter @Setter
public class LobbyPlayer implements Serializable {

    private String userId;
    private boolean isHost;
    private LobbyPlayerStatus status;
    private int seat;

    public LobbyPlayer() {}

    public LobbyPlayer(String userId, boolean isHost, LobbyPlayerStatus status) {
        this.userId = userId;
        this.isHost = isHost;
        this.status = status;
    }

    public LobbyPlayer(String userId, boolean isHost, LobbyPlayerStatus status, int seat) {
        this.userId = userId;
        this.isHost = isHost;
        this.status = status;
        this.seat = seat;
    }

}
