package pro.damjan.belabackend.security.cors;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Slf4j
@Configuration
@Profile("prod")
public class ProdCorsConfig {

    @Value("${app.frontend-domain}")
    private String frontendDomain;

    @Bean
    public WebMvcConfigurer corsConfigurer() {
        log.info("Initializing CORS configuration for production environment");

        return new WebMvcConfigurer() {
            @Override
            public void addCorsMappings(CorsRegistry registry) {
                registry.addMapping("/**") // Enable for all paths
                        .allowedOrigins(frontendDomain) // Frontend URL
                        .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                        .allowedHeaders("*")
                        .allowCredentials(false);
            }
        };
    }
}
