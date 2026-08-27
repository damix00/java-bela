package pro.damjan.belabackend.user.dto.request;

import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

/**
 * The body of {@code PATCH /users/me}.
 *
 * Every field is optional, which is what makes this a PATCH: a null field is
 * "leave it alone", and only the keys the client actually sent get written. The
 * two nullable text fields tell the two apart the other way round as well — an
 * empty string means "clear it", which is the only way a player can take their
 * bio back down once they have written one.
 *
 * The bounds match {@code apps/web/src/lib/validation.ts}: the form is what
 * tells the player the rule, this is what enforces it.
 */
@Getter @Setter
public class UpdateProfileRequest {

    @Size(min = 3, max = 16, message = "Username must be between 3 and 16 characters")
    @Pattern(regexp = "^[a-zA-Z0-9._-]+$", message = "Username has invalid characters")
    private String username;

    @Size(max = 160, message = "Bio is too long")
    private String bio;

    /** ISO 3166-1 alpha-2. Matched case-insensitively; the service uppercases before saving. */
    @Pattern(regexp = "^$|^[a-zA-Z]{2}$", message = "Country code must be two letters")
    private String countryCode;

    public UpdateProfileRequest() {}

    public UpdateProfileRequest(String username, String bio, String countryCode) {
        this.username = username;
        this.bio = bio;
        this.countryCode = countryCode;
    }
}
