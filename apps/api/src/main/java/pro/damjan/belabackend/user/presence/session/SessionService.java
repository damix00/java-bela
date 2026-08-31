package pro.damjan.belabackend.user.presence.session;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

@Service
@RequiredArgsConstructor
public class SessionService {

    private final SessionRepository sessionRepository;

    public UserSession createSession(String userId, SessionMetadata metadata) {
        UserSession session = new UserSession();
        session.setUserId(userId);
        session.setActive(false);
        session.setCreatedAt(Instant.now());
        session.setMetadata(metadata);
        return sessionRepository.save(session);
    }

    public void keepAlive(String sessionId) {
        UserSession session = sessionRepository.findById(sessionId).orElse(null);
        if (session != null) {
            session.setTtl(30);
            sessionRepository.save(session);
        }
    }

    /**
     * The session currently holding the player's seat, or null if none does.
     *
     * The newest of them when more than one looks active. Takeover is meant to
     * leave exactly one, but it is not a transaction — two handshakes landing
     * together can both write — and picking the newest is the same rule the
     * takeover itself applies, so the state heals rather than sticking on
     * whichever session Redis happened to return first.
     */
    public UserSession getActiveSession(String userId) {
        return findUserSessions(userId).stream()
                .filter(UserSession::isActive)
                .max(Comparator.comparing(UserSession::getCreatedAt, Comparator.nullsFirst(Comparator.naturalOrder())))
                .orElse(null);
    }

    public boolean userHasActiveSession(String userId) {
        return getActiveSession(userId) != null;
    }

    public void lockSession(String sessionId) {
        UserSession session = sessionRepository.findById(sessionId).orElse(null);

        if (session != null) {
            session.setActive(true);
            sessionRepository.save(session);
        }
    }

    /**
     * Stands every one of the user's other sessions down, and reports which of
     * them had the seat.
     *
     * The returned sessions are the ones that were actually holding it, because
     * those are the connections that have to be told they lost it. Sessions
     * that were already inactive are left out — there is nothing to announce to
     * a window that was never playing.
     */
    public List<UserSession> deactivateOtherSessions(String userId, String keepSessionId) {
        List<UserSession> superseded = new ArrayList<>();

        for (UserSession session : findUserSessions(userId)) {
            if (session.getId().equals(keepSessionId) || !session.isActive()) continue;

            session.setActive(false);
            sessionRepository.save(session);
            superseded.add(session);
        }

        return superseded;
    }

    public void unlockUserSessions(String userId) {
        for (UserSession session : findUserSessions(userId)) {
            if (!session.isActive()) continue;

            session.setActive(false);
            sessionRepository.save(session);
        }
    }

    public void deleteSession(String sessionId) {
        sessionRepository.deleteById(sessionId);
    }

    private List<UserSession> findUserSessions(String userId) {
        List<UserSession> sessions = sessionRepository.findByUserId(userId);
        return sessions == null ? List.of() : sessions;
    }
}
