package pro.damjan.belabackend.websocket;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.socket.config.annotation.EnableWebSocket;
import org.springframework.web.socket.config.annotation.WebSocketConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry;
import org.springframework.web.socket.server.standard.ServletServerContainerFactoryBean;

@Configuration
@EnableWebSocket
public class WebSocketConfig implements WebSocketConfigurer {

    private final GameWebSocketHandler handler;
    private final WebSocketAuthInterceptor webSocketAuthInterceptor;

    /**
     * The handshake check here is separate from the CORS beans — a WebSocket upgrade never goes
     * through the CORS filter, so leaving this open would have kept the socket reachable from any
     * origin no matter how tightly {@code ProdCorsConfig} was written.
     */
    private final String frontendDomain;

    public WebSocketConfig(GameWebSocketHandler handler,
                           WebSocketAuthInterceptor webSocketAuthInterceptor,
                           @Value("${app.frontend-domain}") String frontendDomain) {
        this.handler = handler;
        this.webSocketAuthInterceptor = webSocketAuthInterceptor;
        this.frontendDomain = frontendDomain;
    }

    @Override
    public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
        registry.addHandler(handler, "/ws")
                .addInterceptors(webSocketAuthInterceptor)
                .setAllowedOrigins(frontendDomain);
    }

    @Bean
    public ServletServerContainerFactoryBean createWebSocketContainer() {
        ServletServerContainerFactoryBean container = new ServletServerContainerFactoryBean();
        container.setMaxSessionIdleTimeout(30_000L); // 30 seconds idle timeout
        return container;
    }
}
