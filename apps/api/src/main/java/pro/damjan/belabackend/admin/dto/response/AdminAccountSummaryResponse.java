package pro.damjan.belabackend.admin.dto.response;

import pro.damjan.belabackend.user.auth.AuthProvider;
import pro.damjan.belabackend.user.auth.Role;
import pro.damjan.belabackend.user.presence.PresenceStatus;

import java.time.Instant;

public record AdminAccountSummaryResponse(
        String id,
        String username,
        String email,
        AuthProvider authProvider,
        Role role,
        Instant createdAt,
        Instant lastLoginAt,
        boolean active,
        long sessionCount,
        PresenceStatus presenceStatus
) {}
