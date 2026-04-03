package pro.damjan.belabackend.game.exception;

import org.springframework.http.HttpStatus;
import pro.damjan.belabackend.exception.ExceptionResponse;

public class GameNotFoundException extends ExceptionResponse {

    public GameNotFoundException() {
        super(HttpStatus.NOT_FOUND, "Game not found");
    }
}
