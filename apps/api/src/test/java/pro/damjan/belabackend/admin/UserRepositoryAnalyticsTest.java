package pro.damjan.belabackend.admin;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.annotation.Transactional;
import pro.damjan.belabackend.user.User;
import pro.damjan.belabackend.user.UserRepository;
import pro.damjan.belabackend.user.auth.AuthProvider;
import pro.damjan.belabackend.user.auth.Role;

import java.time.Duration;
import java.time.Instant;
import java.sql.Timestamp;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest(
        webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT,
        properties = "app.internal-api-key=test-internal-api-key"
)
@Transactional
class UserRepositoryAnalyticsTest {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Test
    void countsAccountsByProviderRoleAndCreationWindow() {
        // The developer database may already contain accounts. The transaction rolls this
        // isolation delete back with the fixtures, so running the test never destroys them.
        userRepository.deleteAll();
        Instant now = Instant.parse("2026-09-02T12:00:00Z");
        List<User> users = List.of(
                user("RecentLocal", AuthProvider.LOCAL, Role.USER, now.minus(Duration.ofHours(2))),
                user("OlderLocal", AuthProvider.LOCAL, Role.USER, now.minus(Duration.ofDays(8))),
                user("CurrentGuest", AuthProvider.ANONYMOUS, Role.USER, now.minus(Duration.ofHours(1))),
                user("OldAdmin", AuthProvider.LOCAL, Role.ADMIN, now.minus(Duration.ofDays(40)))
        );
        userRepository.saveAllAndFlush(users);
        // @CreatedDate deliberately owns inserts and replaces supplied timestamps. Set the
        // fixture times with SQL so this test exercises the actual repository predicate.
        setCreatedAt("RecentLocal", now.minus(Duration.ofHours(2)));
        setCreatedAt("OlderLocal", now.minus(Duration.ofDays(8)));
        setCreatedAt("CurrentGuest", now.minus(Duration.ofHours(1)));
        setCreatedAt("OldAdmin", now.minus(Duration.ofDays(40)));

        assertThat(userRepository.countByAuthProvider(AuthProvider.LOCAL)).isEqualTo(3);
        assertThat(userRepository.countByAuthProvider(AuthProvider.ANONYMOUS)).isEqualTo(1);
        assertThat(userRepository.countByRole(Role.ADMIN)).isEqualTo(1);
        assertThat(countRegisteredSince(now.minus(Duration.ofHours(24)))).isEqualTo(1);
        assertThat(countRegisteredSince(now.minus(Duration.ofDays(7)))).isEqualTo(1);
        assertThat(countRegisteredSince(now.minus(Duration.ofDays(30)))).isEqualTo(2);
    }

    private long countRegisteredSince(Instant cutoff) {
        return userRepository.countByAuthProviderAndCreatedAtGreaterThanEqual(AuthProvider.LOCAL, cutoff);
    }

    private void setCreatedAt(String username, Instant createdAt) {
        jdbcTemplate.update(
                "update users set created_at = ? where username = ?",
                Timestamp.from(createdAt),
                username
        );
    }

    private static User user(String username, AuthProvider authProvider, Role role, Instant createdAt) {
        User user = new User();
        user.setUsername(username);
        user.setAuthProvider(authProvider);
        user.setRole(role);
        user.setCreatedAt(createdAt);
        user.setUpdatedAt(createdAt);
        return user;
    }
}
