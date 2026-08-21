package pro.damjan.belabackend.lobby.exception;

import org.springframework.http.HttpStatus;
import pro.damjan.belabackend.exception.ExceptionResponse;

public class PlayerNotHostException extends ExceptionResponse {
    public PlayerNotHostException() {
        super(HttpStatus.UNAUTHORIZED, "Player is not the lobby host");
    }
}
