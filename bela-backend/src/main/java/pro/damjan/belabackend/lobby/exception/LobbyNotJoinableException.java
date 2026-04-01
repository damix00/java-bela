package pro.damjan.belabackend.lobby.exception;

import org.springframework.http.HttpStatus;
import pro.damjan.belabackend.exception.ExceptionResponse;

public class LobbyNotJoinableException extends ExceptionResponse {

    public LobbyNotJoinableException() {
        super(HttpStatus.UNAUTHORIZED, "Lobby is not joinable");
    }
}
