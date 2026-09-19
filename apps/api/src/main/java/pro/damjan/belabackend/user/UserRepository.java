package pro.damjan.belabackend.user;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import jakarta.persistence.LockModeType;
import pro.damjan.belabackend.user.auth.AuthProvider;
import pro.damjan.belabackend.user.auth.Role;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, String>, JpaSpecificationExecutor<User> {
    Optional<User> findByUsername(String username);
    boolean existsByUsername(String username);
    Optional<User> findByEmail(String email);
    Optional<User> findByEmailIgnoreCaseAndAuthProvider(String email, AuthProvider authProvider);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select u from User u where u.id = :id")
    Optional<User> findByIdForUpdate(@Param("id") String id);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select u from User u where u.role = :role order by u.id")
    List<User> findAllByRoleForUpdate(@Param("role") Role role);

    long countByAuthProvider(AuthProvider authProvider);
    long countByRole(Role role);
    long countByAuthProviderAndCreatedAtGreaterThanEqual(AuthProvider authProvider, Instant createdAt);

    void deleteUsersByAuthProviderAndCreatedAtBefore(AuthProvider authProvider, Instant createdAtBefore);

    @Query("select u.id from User u where u.authProvider = :authProvider and u.createdAt < :createdAtBefore")
    List<String> findIdsByAuthProviderAndCreatedAtBefore(@Param("authProvider") AuthProvider authProvider,
                                                         @Param("createdAtBefore") Instant createdAtBefore);
}
