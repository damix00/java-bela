package pro.damjan.belabackend.lobby.exception;

import org.springframework.http.HttpStatus;
import pro.damjan.belabackend.exception.ExceptionResponse;

public class PlayerNotInLobbyException extends ExceptionResponse {
    public PlayerNotInLobbyException() {
        super(HttpStatus.BAD_REQUEST, "Player is not in a lobby");
    }
}

