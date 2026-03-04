package pro.damjan.belabackend.websocket;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.socket.config.annotation.EnableWebSocket;
import org.springframework.web.socket.config.annotation.WebSocketConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry;

@Configuration
@EnableWebSocket
public class WebSocketConfig implements WebSocketConfigurer {

    private final GameWebSocketHandler handler;
    private final WebSocketAuthInterceptor webSocketAuthInterceptor;

    public WebSocketConfig(GameWebSocketHandler handler, WebSocketAuthInterceptor webSocketAuthInterceptor) {
        this.handler = handler;
        this.webSocketAuthInterceptor = webSocketAuthInterceptor;
    }

    @Override
    public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
        registry.addHandler(handler, "/ws")
                .addInterceptors(webSocketAuthInterceptor)
                .setAllowedOrigins("*"); // TODO: tighten in production
    }
}
