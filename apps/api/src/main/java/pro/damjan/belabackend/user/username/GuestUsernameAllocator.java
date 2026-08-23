package pro.damjan.belabackend.user.username;

import org.springframework.stereotype.Component;
import pro.damjan.belabackend.user.UserRepository;

import java.util.List;

/**
 * Finds a guest username that no user currently holds.
 *
 * <p>Follows the same generate-then-check shape as lobby invite codes, but with a bounded
 * number of attempts and a widening numeric suffix, so a crowded namespace degrades into
 * longer names rather than an unbounded loop.
 */
@Component
public class GuestUsernameAllocator {

    /** One rung of the escalation ladder: how wide the suffix is, and how many names to try at that width. */
    private record Rung(int suffixDigits, int attempts) {}

    /**
     * Short names first, widening only when the short ones keep colliding. Two digits is
     * 13.3 million names, four is 1.33 billion, eight is past any plausible collision.
     */
    private static final List<Rung> LADDER = List.of(
            new Rung(2, 5),
            new Rung(4, 3),
            new Rung(8, 2));

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
        for (Rung rung : LADDER) {
            String name = tryAllocate(rung);
            if (name != null) {
                return name;
            }
        }
        return guestUsernameGenerator.generateWithHexSuffix();
    }

    private String tryAllocate(Rung rung) {
        for (int attempt = 0; attempt < rung.attempts(); attempt++) {
            String candidate = guestUsernameGenerator.generate(rung.suffixDigits());
            if (!userRepository.existsByUsername(candidate)) {
                return candidate;
            }
        }
        return null;
    }
}
