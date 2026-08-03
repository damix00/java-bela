package pro.damjan.belabackend.game.model;

import java.io.Serializable;

public enum GameStatus implements Serializable {
    WAITING, // Waiting for players to join and the game to start
    IN_PROGRESS,
    FINISHED
}
