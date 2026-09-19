package pro.damjan.belabackend.admin.account;

import org.springframework.data.jpa.repository.JpaRepository;

public interface AdminAuditLogRepository extends JpaRepository<AdminAuditLog, String> {
}
