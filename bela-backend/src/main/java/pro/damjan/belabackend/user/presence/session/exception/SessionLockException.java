package pro.damjan.belabackend.user.presence.session.exception;

import org.springframework.http.HttpStatus;
import pro.damjan.belabackend.exception.ExceptionResponse;

public class SessionLockException extends ExceptionResponse {

    public SessionLockException() {
        super(HttpStatus.LOCKED, "Session is locked");
    }
}
