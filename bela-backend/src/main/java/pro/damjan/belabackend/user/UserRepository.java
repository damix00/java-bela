package pro.damjan.belabackend.user;

import org.springframework.data.jpa.repository.JpaRepository;
import pro.damjan.belabackend.user.auth.AuthProvider;

import java.time.Instant;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, String> {
    Optional<User> findByUsername(String username);
    Optional<User> findByEmail(String email);

    void deleteUsersByAuthProviderAndCreatedAtBefore(AuthProvider authProvider, Instant createdAtBefore);
}
