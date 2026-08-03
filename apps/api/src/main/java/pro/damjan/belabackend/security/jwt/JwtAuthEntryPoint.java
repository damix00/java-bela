package pro.damjan.belabackend.security.jwt;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.stereotype.Component;

import java.io.IOException;

/**
 * Without this, an unauthenticated request to a protected route gets Spring's default 403,
 * which a client cannot tell apart from a genuine authorization failure.
 */
@Component
public class JwtAuthEntryPoint implements AuthenticationEntryPoint {

    private final AuthErrorWriter authErrorWriter;

    public JwtAuthEntryPoint(AuthErrorWriter authErrorWriter) {
        this.authErrorWriter = authErrorWriter;
    }

    @Override
    public void commence(HttpServletRequest request,
                         HttpServletResponse response,
                         AuthenticationException authException) throws IOException {
        authErrorWriter.write(response, HttpStatus.UNAUTHORIZED, "UNAUTHENTICATED", "Authentication required");
    }
}
