package pro.damjan.belabackend.admin.dto.response;

import java.time.Instant;

public record AdminAccountSessionResponse(
        String id,
        boolean active,
        Instant createdAt,
        String ipAddress,
        String userAgent
) {}
