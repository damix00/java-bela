package pro.damjan.belabackend.websocket;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
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

import java.util.Map;

/**
 * Authenticates the handshake only; a socket stays valid for its lifetime once open, and every
 * reconnect brings a fresh access token.
 *
 * <p>On failure this accepts the handshake and flags it, rather than returning 401. A browser
 * WebSocket cannot observe a failed handshake's HTTP status — onclose reports 1006, which is
 * indistinguishable from "server is down" — so the client would retry forever. Accepting and
 * then closing with an application close code is the only way to tell it to stop.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class WebSocketAuthInterceptor implements HandshakeInterceptor {

    public static final String AUTH_ERROR_ATTRIBUTE = "authError";

    private final JwtService jwtService;
    private final SessionService sessionService;
    private final UserService userService;

    @Override
    public boolean beforeHandshake(ServerHttpRequest request, ServerHttpResponse response,
                                   WebSocketHandler wsHandler, Map<String, Object> attributes) {
        if (!(request instanceof ServletServerHttpRequest servletRequest)) {
            attributes.put(AUTH_ERROR_ATTRIBUTE, true);
            return true;
        }

        String token = servletRequest.getServletRequest().getParameter("token");
        String userId = jwtService.getIdFromToken(token);

        if (userId == null) {
            log.warn("WebSocket handshake with a missing or invalid token");
            attributes.put(AUTH_ERROR_ATTRIBUTE, true);
            return true;
        }

        User user = userService.getUserById(userId);
        if (user == null) {
            log.warn("WebSocket handshake for non-existent user ID [{}]", userId);
            attributes.put(AUTH_ERROR_ATTRIBUTE, true);
            return true;
        }

        UserSession userSession = sessionService.createSession(
                userId,
                SessionMetadata.builder()
                        .userAgent(servletRequest.getServletRequest().getHeader("User-Agent"))
                        .ipAddress(servletRequest.getServletRequest().getRemoteAddr())
                        .build()
        );

        if (userSession == null) {
            log.error("Failed to create a user session for [{}] during WebSocket handshake", userId);
            attributes.put(AUTH_ERROR_ATTRIBUTE, true);
            return true;
        }

        attributes.put("userId", userId);
        attributes.put("user", user);
        attributes.put("userSession", userSession);

        return true;
    }

    @Override
    public void afterHandshake(ServerHttpRequest request, ServerHttpResponse response,
                               WebSocketHandler wsHandler, Exception exception) {
        // No action needed
    }

}
