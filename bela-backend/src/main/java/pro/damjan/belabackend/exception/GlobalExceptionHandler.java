package pro.damjan.belabackend.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import pro.damjan.belabackend.auth.InvalidLoginException;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(InvalidLoginException.class)
    public ResponseEntity<String> handleInvalidLogin(InvalidLoginException ex) {
        return ResponseEntity
                .status(HttpStatus.UNAUTHORIZED)
                .body(ex.getMessage());

    }
}
