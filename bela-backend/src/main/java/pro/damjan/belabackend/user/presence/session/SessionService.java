package pro.damjan.belabackend.user.presence.session;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class SessionService {

    private final SessionRepository sessionRepository;

    public UserSession createSession(String userId, SessionMetadata metadata) {
        UserSession session = new UserSession();
        session.setUserId(userId);
        session.setActive(false);
        session.setMetadata(metadata);
        return sessionRepository.save(session);
    }

    public void keepAlive(String sessionId) {
        UserSession session = sessionRepository.findById(sessionId).orElse(null);
        if (session != null) {
            session.setTtl(60); // Reset TTL to 60 seconds
            sessionRepository.save(session);
        }
    }

    public UserSession getActiveSession(String userId) {
        return sessionRepository.findByUserIdAndActiveTrue(userId).orElse(null);
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

    public void unlockUserSessions(String userId) {
        UserSession session = sessionRepository.findByUserIdAndActiveTrue(userId).orElse(null);
        if (session != null) {
            session.setActive(false);
            sessionRepository.save(session);
        }
    }

    public void deleteSession(String sessionId) {
        sessionRepository.deleteById(sessionId);
    }
}
