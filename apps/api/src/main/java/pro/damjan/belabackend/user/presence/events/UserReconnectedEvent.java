package pro.damjan.belabackend.user.presence.events;

public record UserReconnectedEvent(String userId, String sessionId) {}