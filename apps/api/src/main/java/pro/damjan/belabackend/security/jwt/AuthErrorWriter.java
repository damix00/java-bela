package pro.damjan.belabackend.security.jwt;

import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import tools.jackson.databind.ObjectMapper;

import java.io.IOException;
import java.util.Map;

/**
 * Auth failures are written from a servlet filter and from the entry point, neither of which
 * @RestControllerAdvice can reach. This keeps both producing the same {message, code} shape
 * the frontend branches on.
 */
@Component
public class AuthErrorWriter {

    private final ObjectMapper objectMapper;

    public AuthErrorWriter(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    public void write(HttpServletResponse response, HttpStatus status, String code, String message)
            throws IOException {
        response.setStatus(status.value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setCharacterEncoding("UTF-8");
        objectMapper.writeValue(response.getWriter(), Map.of("message", message, "code", code));
    }
}
