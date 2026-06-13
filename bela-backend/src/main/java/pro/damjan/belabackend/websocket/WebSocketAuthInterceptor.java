package pro.damjan.belabackend.websocket;

import jakarta.servlet.http.Cookie;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.http.server.ServletServerHttpRequest;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.server.HandshakeInterceptor;
import pro.damjan.belabackend.security.jwt.JwtService;
import pro.damjan.belabackend.user.User;
import pro.damjan.belabackend.user.UserService;
import pro.damjan.belabackend.user.presence.session.SessionMetadata;
import pro.damjan.belabackend.user.presence.session.SessionService;
import pro.damjan.belabackend.user.presence.session.UserSession;

import java.util.Arrays;
import java.util.Map;

@Slf4j
@Component
@RequiredArgsConstructor
public class WebSocketAuthInterceptor implements HandshakeInterceptor {

    private final JwtService jwtService;
    private final SessionService sessionService;
    private final UserService userService;

    @Override
    public boolean beforeHandshake(ServerHttpRequest request, ServerHttpResponse response,
                                   WebSocketHandler wsHandler, Map<String, Object> attributes) {
        if (request instanceof ServletServerHttpRequest servletRequest) {
            // Prefer the token from the handshake query param (works cross-origin,
            // where the httpOnly cookie may not be attached), fall back to the cookie.
            String token = servletRequest.getServletRequest().getParameter("token");

            if (token == null || token.isBlank()) {
                Cookie[] cookies = servletRequest.getServletRequest().getCookies();

                token = Arrays.stream(cookies != null ? cookies : new Cookie[0])
                        .filter(c -> "token".equals(c.getName()))
                        .findFirst()
                        .map(Cookie::getValue)
                        .orElse(null);
            }

            try {
                // Determine user ID (this might throw an exception if token is expired/invalid)
                String userId = jwtService.getIdFromToken(token);

                if (userId != null) {
                    User user = userService.getUserById(userId);

                    if (user == null) {
                        log.warn("WebSocket connection attempt with non-existent user ID [{}]", userId);
                        response.setStatusCode(HttpStatus.UNAUTHORIZED);
                        return false;
                    }

                    // Create a new session
                    UserSession userSession = sessionService.createSession(
                            userId,
                            SessionMetadata.builder()
                                    .userAgent(servletRequest.getServletRequest().getHeader("User-Agent"))
                                    .ipAddress(servletRequest.getServletRequest().getRemoteAddr())
                                    .build()
                    );

                    if (userSession == null) {
                        throw new Exception("Something went wrong while creating user session");
                    }

                    attributes.put("userId", userId);
                    attributes.put("user", user);

                    attributes.put("userSession", userSession);

                    return true;
                }
                else {
                    log.warn("WebSocket connection attempt with invalid token");
                }
            } catch (Exception e) {
                // Log exception if needed
            }
        }

        response.setStatusCode(HttpStatus.UNAUTHORIZED);
        return false;
    }

    @Override
    public void afterHandshake(ServerHttpRequest request, ServerHttpResponse response,
                               WebSocketHandler wsHandler, Exception exception) {
        // No action needed
    }

}
