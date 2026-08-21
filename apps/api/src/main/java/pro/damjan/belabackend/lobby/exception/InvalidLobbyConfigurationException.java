package pro.damjan.belabackend.lobby.exception;

import org.springframework.http.HttpStatus;
import pro.damjan.belabackend.exception.ExceptionResponse;

public class InvalidLobbyConfigurationException extends ExceptionResponse {

    public InvalidLobbyConfigurationException() {
        super(HttpStatus.BAD_REQUEST, "Invalid lobby configuration");
    }
}
