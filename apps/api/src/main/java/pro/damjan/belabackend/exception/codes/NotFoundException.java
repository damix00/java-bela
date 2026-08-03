package pro.damjan.belabackend.exception.codes;

import org.springframework.http.HttpStatus;
import pro.damjan.belabackend.exception.ExceptionResponse;

public class NotFoundException extends ExceptionResponse {
    public NotFoundException() {
        super(HttpStatus.NOT_FOUND, "Not Found");
    }
}
