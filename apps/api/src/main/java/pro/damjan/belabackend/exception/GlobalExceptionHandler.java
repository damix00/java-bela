package pro.damjan.belabackend.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
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

    /**
     * A request body that failed its own {@code @Valid} constraints.
     *
     * Without this the exception leaves the handler unhandled — it is not a
     * {@link RuntimeException}, so the catch-all below never sees it — and
     * reaches the security filter chain, which answers every exception that
     * gets that far with 401. A bio two characters too long would come back
     * indistinguishable from an expired token.
     *
     * One message, not a map of them: these are the same rules the forms print
     * under their own fields, so by the time one is broken here the client has
     * already been told which field it was.
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, String>> handleValidationException(MethodArgumentNotValidException ex) {
        String message = ex.getBindingResult().getFieldErrors().stream()
                .findFirst()
                .map(error -> error.getDefaultMessage())
                .orElse("Invalid request");

        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(Map.of(
                        "message", message,
                        "code", "VALIDATION_FAILED"
                ));
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
