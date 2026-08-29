package pro.damjan.belabackend.lobby.model;

import java.io.Serializable;

public enum LobbyStatus implements Serializable {
    IN_LOBBY,
    MATCHMAKING,
    IN_GAME
}
