package pro.damjan.belabackend.websocket;

import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.http.server.ServletServerHttpRequest;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.server.HandshakeInterceptor;
import pro.damjan.belabackend.auth.security.JwtService;

import java.util.Map;

@Slf4j
@Component
public class WebSocketAuthInterceptor implements HandshakeInterceptor {

    private final JwtService jwtService;

    public WebSocketAuthInterceptor(JwtService jwtService) {
        this.jwtService = jwtService;
    }

    @Override
    public boolean beforeHandshake(ServerHttpRequest request, ServerHttpResponse response,
                                   WebSocketHandler wsHandler, Map<String, Object> attributes) {
        if (request instanceof ServletServerHttpRequest servletRequest) {
            String authHeader = servletRequest.getServletRequest().getHeader(HttpHeaders.AUTHORIZATION);

            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                response.setStatusCode(HttpStatus.UNAUTHORIZED);
                return false;
            }

            String token = authHeader.substring(7);

            try {
                // Determine user ID (this might throw an exception if token is expired/invalid)
                String userId = jwtService.getIdFromToken(token);

                if (userId != null) {
                    attributes.put("userId", userId);
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
