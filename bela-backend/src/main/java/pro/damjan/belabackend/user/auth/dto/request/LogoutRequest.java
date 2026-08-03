package pro.damjan.belabackend.user.auth.dto.request;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class LogoutRequest {
    /** Not @NotBlank: logging out with nothing left to revoke must still succeed. */
    private String refreshToken;
}
