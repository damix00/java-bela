package pro.damjan.belabackend.user.auth.refresh;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface RefreshTokenRepository extends JpaRepository<RefreshToken, String> {

    Optional<RefreshToken> findByTokenHash(String tokenHash);

    long countByUserIdAndRevokedAtIsNullAndExpiresAtAfter(String userId, Instant now);

    List<RefreshToken> findAllByUserIdAndRevokedAtIsNullAndExpiresAtAfterOrderByCreatedAtAsc(
            String userId, Instant now);

    void deleteByExpiresAtBefore(Instant cutoff);

    void deleteByUserIdIn(Collection<String> userIds);

    /**
     * Consumes a token, but only if nobody has consumed it yet. This conditional update is the
     * whole concurrency story: two simultaneous rotations cannot both see usedAt == null, so
     * exactly one gets a row count of 1 and mints the successor. No lock needed, works across
     * instances.
     */
    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("update RefreshToken r set r.usedAt = :now where r.id = :id and r.usedAt is null")
    int markUsed(@Param("id") String id, @Param("now") Instant now);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("update RefreshToken r set r.revokedAt = :now where r.familyId = :familyId and r.revokedAt is null")
    int revokeFamily(@Param("familyId") String familyId, @Param("now") Instant now);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("update RefreshToken r set r.revokedAt = :now where r.userId = :userId and r.revokedAt is null")
    int revokeAllForUser(@Param("userId") String userId, @Param("now") Instant now);
}
