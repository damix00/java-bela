package pro.damjan.belabackend.user.auth.refresh;

import pro.damjan.belabackend.user.User;

/**
 * @param newRefreshToken the raw successor token, or null when the caller lost a rotation race
 *                        but landed inside the grace window — meaning "here is a fresh access
 *                        token, keep the refresh token you already have".
 */
public record RotationResult(User user, String newRefreshToken, long refreshExpiresInSeconds) {
}
