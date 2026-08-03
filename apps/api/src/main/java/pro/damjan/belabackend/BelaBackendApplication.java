package pro.damjan.belabackend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class BelaBackendApplication {

    public static void main(String[] args) {
        SpringApplication.run(BelaBackendApplication.class, args);
    }

}
