package pro.damjan.belabackend.lobby.model;

import jakarta.persistence.Id;
import lombok.Getter;
import lombok.Setter;
import org.springframework.data.redis.core.RedisHash;

import java.io.Serializable;

@RedisHash("Lobby")
@Getter @Setter
public class Lobby implements Serializable {
    @Id
    private String id;

    // List of players in the lobby (max 4)
    private LobbyPlayer[] players = new LobbyPlayer[4];
}
