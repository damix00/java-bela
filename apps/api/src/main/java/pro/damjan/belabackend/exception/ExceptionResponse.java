package pro.damjan.belabackend.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;

public class ExceptionResponse extends RuntimeException {

    @Getter
    private final HttpStatus status;

    public ExceptionResponse(HttpStatus status, String message) {
        super(message);
        this.status = status;
    }
}
