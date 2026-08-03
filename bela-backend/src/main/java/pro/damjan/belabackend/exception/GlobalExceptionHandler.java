package pro.damjan.belabackend.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import pro.damjan.belabackend.user.auth.refresh.RefreshError;
import pro.damjan.belabackend.user.auth.refresh.RefreshTokenException;

import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(ExceptionResponse.class)
    public ResponseEntity<Map<String, String>> handleCustomException(ExceptionResponse ex) {
        return ResponseEntity
                .status(ex.getStatus())
                .body(Map.of(
                        "message", ex.getMessage()
                ));
    }

    @ExceptionHandler(RefreshTokenException.class)
    public ResponseEntity<Map<String, String>> handleRefreshTokenException(RefreshTokenException ex) {
        return ResponseEntity
                .status(HttpStatus.UNAUTHORIZED)
                .body(Map.of(
                        "message", ex.getMessage(),
                        "code", codeFor(ex.getError())
                ));
    }

    private static String codeFor(RefreshError error) {
        return switch (error) {
            case INVALID -> "REFRESH_INVALID";
            case EXPIRED -> "REFRESH_EXPIRED";
            case REUSE_DETECTED -> "REFRESH_REUSED";
            case USER_GONE -> "USER_GONE";
        };
    }

    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<Map<String, String>> handleRuntimeException(RuntimeException ex) {
        return ResponseEntity
                .status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of(
                        "message", "Internal server error"
                ));
    }
}
