package pro.damjan.belabackend.user.auth.refresh;

import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

/**
 * Revocation that has to survive the exception thrown right after it.
 *
 * <p>Reuse detection revokes a token family and then throws, but a RuntimeException rolls the
 * caller's transaction back — which would quietly undo the revocation and leave a known-stolen
 * lineage working. REQUIRES_NEW commits it independently. The caller holds no lock on these
 * rows at that point (the conditional markUsed matched zero rows), so there is nothing to
 * deadlock against.
 */
@Component
public class RefreshTokenRevoker {

    private final RefreshTokenRepository refreshTokenRepository;

    public RefreshTokenRevoker(RefreshTokenRepository refreshTokenRepository) {
        this.refreshTokenRepository = refreshTokenRepository;
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void revokeFamilyNow(String familyId) {
        refreshTokenRepository.revokeFamily(familyId, Instant.now());
    }
}
