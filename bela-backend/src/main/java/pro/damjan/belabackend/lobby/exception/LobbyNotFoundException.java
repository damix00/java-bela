package pro.damjan.belabackend.lobby.exception;

import org.springframework.http.HttpStatus;
import pro.damjan.belabackend.exception.ExceptionResponse;

public class LobbyNotFoundException extends ExceptionResponse {
    public LobbyNotFoundException() {
        super(HttpStatus.NOT_FOUND, "Lobby not found");
    }
}
