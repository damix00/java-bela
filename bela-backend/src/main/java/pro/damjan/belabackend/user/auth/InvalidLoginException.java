package pro.damjan.belabackend.user.auth;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;
import pro.damjan.belabackend.exception.ExceptionResponse;

public class InvalidLoginException extends ExceptionResponse {
    public InvalidLoginException(String message) {
        super(HttpStatus.UNAUTHORIZED, message);
    }
}

