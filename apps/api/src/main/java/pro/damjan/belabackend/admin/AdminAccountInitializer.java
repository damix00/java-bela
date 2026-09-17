package pro.damjan.belabackend.admin;

import jakarta.transaction.Transactional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;
import pro.damjan.belabackend.user.User;
import pro.damjan.belabackend.user.UserRepository;
import pro.damjan.belabackend.user.auth.AuthProvider;
import pro.damjan.belabackend.user.auth.Role;

@Component
public class AdminAccountInitializer implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(AdminAccountInitializer.class);

    private final UserRepository userRepository;
    private final String adminEmail;

    public AdminAccountInitializer(UserRepository userRepository,
                                   @Value("${app.admin.email:}") String adminEmail) {
        this.userRepository = userRepository;
        this.adminEmail = adminEmail;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments arguments) {
        String configuredEmail = adminEmail == null ? "" : adminEmail.trim();
        if (configuredEmail.isEmpty()) {
            return;
        }

        userRepository.findByEmailIgnoreCaseAndAuthProvider(configuredEmail, AuthProvider.LOCAL)
                .ifPresentOrElse(this::promote, () -> log.warn(
                        "ADMIN_EMAIL is configured, but the matching local account does not exist yet"));
    }

    private void promote(User user) {
        if (user.getRole() == Role.ADMIN) {
            return;
        }

        user.setRole(Role.ADMIN);
        userRepository.save(user);
        log.info("Promoted the configured local account to ADMIN");
    }
}
