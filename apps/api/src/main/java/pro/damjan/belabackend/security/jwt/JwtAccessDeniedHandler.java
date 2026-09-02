package pro.damjan.belabackend.security.jwt;

import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.web.access.AccessDeniedHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;

@Component
public class JwtAccessDeniedHandler implements AccessDeniedHandler {

    private final AuthErrorWriter authErrorWriter;

    public JwtAccessDeniedHandler(AuthErrorWriter authErrorWriter) {
        this.authErrorWriter = authErrorWriter;
    }

    @Override
    public void handle(HttpServletRequest request,
                       HttpServletResponse response,
                       AccessDeniedException accessDeniedException) throws IOException, ServletException {
        authErrorWriter.write(response, HttpStatus.FORBIDDEN, "FORBIDDEN", "Administrator access required");
    }
}
