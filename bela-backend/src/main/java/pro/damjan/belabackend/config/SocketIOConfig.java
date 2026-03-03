package pro.damjan.belabackend.config;

import com.corundumstudio.socketio.SocketIOServer;
import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import lombok.Getter;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.bind.annotation.CrossOrigin;

@CrossOrigin
@Configuration
public class SocketIOConfig {

    @Getter
    @Value("${app.socketio.host}")
    private String host;

    @Getter
    @Value("${app.socketio.port}")
    private int port;

    private SocketIOServer server;

    private static final Logger log = LoggerFactory.getLogger(SocketIOConfig.class);

    @Bean
    public SocketIOServer socketIOServer() {
        com.corundumstudio.socketio.Configuration config = new com.corundumstudio.socketio.Configuration();

        config.setHostname(host);
        config.setPort(port);

        server = new SocketIOServer(config);

        log.info("Starting socket.io server on port {}", port);

        server.start();

        return server;
    }

    @PreDestroy
    public void destroy() {
        if (server != null) {
            server.stop();
        }
    }

}
