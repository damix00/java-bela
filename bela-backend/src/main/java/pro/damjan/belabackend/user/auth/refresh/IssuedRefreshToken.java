package pro.damjan.belabackend.user.auth.refresh;

/** The raw token, which is only ever seen once, alongside its persisted row. */
public record IssuedRefreshToken(String raw, RefreshToken entity) {

    public long expiresInSeconds() {
        return java.time.Duration.between(entity.getCreatedAt(), entity.getExpiresAt()).toSeconds();
    }
}
