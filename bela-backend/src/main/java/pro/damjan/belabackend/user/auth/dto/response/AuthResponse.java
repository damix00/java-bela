package pro.damjan.belabackend.user.auth.dto.response;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class AuthResponse {

    private String accessToken;

    /**
     * Null when a rotation landed inside the grace window: the caller already holds a valid
     * refresh token and should keep it rather than overwrite it.
     */
    private String refreshToken;

    /** Access token lifetime, in seconds. */
    private long expiresIn;

    /** Refresh token lifetime, in seconds. Zero when refreshToken is null. */
    private long refreshExpiresIn;

    private UserResponse user;
}
