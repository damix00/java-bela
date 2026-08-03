package pro.damjan.belabackend.lobby.exception;

import org.springframework.http.HttpStatus;
import pro.damjan.belabackend.exception.ExceptionResponse;

public class AlreadyInLobbyException extends ExceptionResponse {
    public AlreadyInLobbyException() {
        super(HttpStatus.BAD_REQUEST, "Already in lobby");
    }
}

