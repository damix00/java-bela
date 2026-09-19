package pro.damjan.belabackend.admin.dto.response;

import pro.damjan.belabackend.user.presence.PresenceStatus;

import java.time.Instant;

public record AdminAccountPresenceResponse(
        PresenceStatus status,
        Instant lastPing,
        String lobbyId,
        String gameId
) {}
