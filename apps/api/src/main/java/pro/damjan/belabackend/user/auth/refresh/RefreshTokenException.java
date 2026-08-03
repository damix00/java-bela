package pro.damjan.belabackend.user.auth.refresh;

import lombok.Getter;

@Getter
public class RefreshTokenException extends RuntimeException {

    private final RefreshError error;

    public RefreshTokenException(RefreshError error, String message) {
        super(message);
        this.error = error;
    }
}
