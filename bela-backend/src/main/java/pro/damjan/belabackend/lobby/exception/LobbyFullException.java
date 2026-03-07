package pro.damjan.belabackend.lobby.exception;

import org.springframework.http.HttpStatus;
import pro.damjan.belabackend.exception.ExceptionResponse;

public class LobbyFullException extends ExceptionResponse {
    public LobbyFullException() {
        super(HttpStatus.BAD_REQUEST, "Lobby is full");
    }
}
