package pro.damjan.belabackend.user.username;

import org.springframework.stereotype.Component;
import pro.damjan.belabackend.user.UserRepository;

/**
 * Finds a guest username that no user currently holds.
 *
 * <p>Follows the same generate-then-check shape as lobby invite codes, but with a bounded
 * number of attempts and a widening numeric suffix, so a crowded namespace degrades into
 * longer names rather than an unbounded loop.
 */
@Component
public class GuestUsernameAllocator {

    /** Attempts to spend at each suffix length before widening the suffix. */
    private static final int ATTEMPTS_WITH_FOUR_DIGITS = 5;
    private static final int ATTEMPTS_WITH_SIX_DIGITS = 3;
    private static final int ATTEMPTS_WITH_EIGHT_DIGITS = 2;

    private final GuestUsernameGenerator guestUsernameGenerator;
    private final UserRepository userRepository;

    public GuestUsernameAllocator(GuestUsernameGenerator guestUsernameGenerator,
                                  UserRepository userRepository) {
        this.guestUsernameGenerator = guestUsernameGenerator;
        this.userRepository = userRepository;
    }

    /**
     * @return a username that was free at the time of checking, never null
     */
    public String allocate() {
        String name = tryAllocateWithSuffix(2, ATTEMPTS_WITH_FOUR_DIGITS);
        if (name == null) {
            name = tryAllocateWithSuffix(4, ATTEMPTS_WITH_SIX_DIGITS);
        }
        if (name == null) {
            name = tryAllocateWithSuffix(8, ATTEMPTS_WITH_EIGHT_DIGITS);
        }
        return name != null ? name : guestUsernameGenerator.generateWithHexSuffix();
    }

    private String tryAllocateWithSuffix(int suffixDigits, int attempts) {
        for (int attempt = 0; attempt < attempts; attempt++) {
            String candidate = guestUsernameGenerator.generate(suffixDigits);
            if (!userRepository.existsByUsername(candidate)) {
                return candidate;
            }
        }
        return null;
    }
}
