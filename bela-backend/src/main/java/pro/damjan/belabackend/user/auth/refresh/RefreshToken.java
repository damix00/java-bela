package pro.damjan.belabackend.user.auth.refresh;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;

/**
 * One row per issued refresh token. Rotation creates a successor row sharing the family id,
 * so presenting a consumed token long after the fact is detectable as reuse and can revoke
 * the whole lineage.
 *
 * <p>userId is a plain column rather than a @ManyToOne on purpose: UserCleanupService bulk
 * deletes guest accounts, and an FK without ON DELETE CASCADE — which ddl-auto=update will
 * not emit — would make that sweep throw. No query here needs the join.
 */
@Entity
@Table(
        name = "refresh_tokens",
        indexes = {
                @Index(name = "idx_refresh_tokens_user_id", columnList = "userId"),
                @Index(name = "idx_refresh_tokens_family_id", columnList = "familyId"),
                @Index(name = "idx_refresh_tokens_expires_at", columnList = "expiresAt")
        }
)
@Getter
@Setter
public class RefreshToken {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(nullable = false, unique = true, length = 64)
    private String tokenHash;

    /** Shared by every rotation descended from a single login. */
    @Column(nullable = false, length = 36)
    private String familyId;

    @Column(nullable = false, length = 36)
    private String userId;

    @Column(nullable = false)
    private Instant createdAt;

    @Column(nullable = false)
    private Instant expiresAt;

    /** Set when this token was exchanged for a successor. */
    @Column
    private Instant usedAt;

    /** Set by logout or by reuse detection revoking the family. */
    @Column
    private Instant revokedAt;

    /** Id of the successor row, for debugging a rotation chain. */
    @Column(length = 36)
    private String rotatedToId;

    @Column(length = 512)
    private String userAgent;

    @Column(length = 45)
    private String ipAddress;

    public boolean isExpiredAt(Instant now) {
        return expiresAt.isBefore(now);
    }
}
