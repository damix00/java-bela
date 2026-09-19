package pro.damjan.belabackend.admin.dto.response;

import pro.damjan.belabackend.user.auth.AuthProvider;
import pro.damjan.belabackend.user.auth.Role;

import java.time.Instant;
import java.util.List;

public record AdminAccountDetailResponse(
        String id,
        String username,
        String email,
        String bio,
        String avatarUrl,
        String countryCode,
        AuthProvider authProvider,
        Role role,
        Instant createdAt,
        Instant updatedAt,
        Instant lastLoginAt,
        AdminAccountPresenceResponse presence,
        List<AdminAccountSessionResponse> sessions,
        AdminAccountActionsResponse actions
) {}
