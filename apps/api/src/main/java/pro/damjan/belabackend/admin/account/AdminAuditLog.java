package pro.damjan.belabackend.admin.account;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "admin_audit_log")
@Getter
@Setter
public class AdminAuditLog {
    @Id
    private String id = UUID.randomUUID().toString();

    @Column(nullable = false)
    private String actorUserId;

    @Column(nullable = false)
    private String actorUsername;

    @Column(nullable = false)
    private String targetUserId;

    @Column(nullable = false)
    private String targetUsername;

    private String targetEmail;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AdminAuditAction action;

    @Column(length = 1000)
    private String details;

    @Column(nullable = false, updatable = false)
    private Instant createdAt;
}
