package pro.damjan.belabackend.user.presence.session;

import org.springframework.data.repository.CrudRepository;

import java.util.Optional;

public interface SessionRepository extends CrudRepository<UserSession, String> {
    Optional<UserSession> findByUserIdAndActiveTrue(String userId);
}
