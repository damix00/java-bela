package pro.damjan.belabackend.user.username;

import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.io.UncheckedIOException;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.util.List;

/**
 * Builds candidate guest usernames of the form {@code AdjectiveNoun####}, for example
 * {@code SwiftFalcon4821}.
 *
 * <p>The word lists live server-side so that every client renders the same name, and are
 * curated to 3-6 characters each so a four-digit name fits the 16-character budget the
 * frontend applies to usernames.
 *
 * <p>This class only produces candidates; it does not know whether a name is already taken.
 * See {@link GuestUsernameAllocator} for that.
 */
@Component
public class GuestUsernameGenerator {

    private static final String ADJECTIVES_RESOURCE = "usernames/adjectives.txt";
    private static final String NOUNS_RESOURCE = "usernames/nouns.txt";

    /**
     * The suffix width the guarantees below are stated against. Allocation starts at a
     * shorter suffix and widens on collision, so this is the ladder's four-digit rung
     * rather than the first name a guest is offered.
     */
    static final int BASELINE_SUFFIX_DIGITS = 4;

    /** Both word lists plus a baseline suffix must reach at least this many names. */
    static final long MINIMUM_COMBINATIONS = 100_000_000L;

    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    private final List<String> adjectives;
    private final List<String> nouns;

    public GuestUsernameGenerator() {
        this(readWords(ADJECTIVES_RESOURCE), readWords(NOUNS_RESOURCE));
    }

    GuestUsernameGenerator(List<String> adjectives, List<String> nouns) {
        this.adjectives = List.copyOf(adjectives);
        this.nouns = List.copyOf(nouns);

        long combinations = combinationCount();
        if (combinations < MINIMUM_COMBINATIONS) {
            throw new IllegalStateException(
                    "Guest username word lists yield only " + combinations
                            + " combinations, below the required " + MINIMUM_COMBINATIONS);
        }
    }

    /**
     * @return the number of distinct names reachable with the default suffix length.
     */
    public long combinationCount() {
        return (long) adjectives.size() * nouns.size() * pow10(BASELINE_SUFFIX_DIGITS);
    }

    /**
     * @param suffixDigits how many digits the zero-padded numeric suffix should have
     * @return a candidate username, not checked for availability
     */
    public String generate(int suffixDigits) {
        if (suffixDigits < 1) {
            throw new IllegalArgumentException("suffixDigits must be at least 1, got " + suffixDigits);
        }

        String adjective = pick(adjectives);
        String noun = pick(nouns);
        int suffix = SECURE_RANDOM.nextInt(pow10(suffixDigits));

        return capitalize(adjective) + capitalize(noun) + zeroPad(suffix, suffixDigits);
    }

    /**
     * Builds a name whose suffix is random hexadecimal rather than decimal, giving the
     * allocator a last resort that is effectively certain to be free.
     */
    public String generateWithHexSuffix() {
        return capitalize(pick(adjectives)) + capitalize(pick(nouns))
                + Long.toHexString(SECURE_RANDOM.nextLong() >>> 16);
    }

    private static String pick(List<String> words) {
        return words.get(SECURE_RANDOM.nextInt(words.size()));
    }

    private static String zeroPad(int value, int digits) {
        return String.format("%0" + digits + "d", value);
    }

    private static String capitalize(String word) {
        return Character.toUpperCase(word.charAt(0)) + word.substring(1);
    }

    private static int pow10(int exponent) {
        int result = 1;
        for (int i = 0; i < exponent; i++) {
            result *= 10;
        }
        return result;
    }

    private static List<String> readWords(String resourcePath) {
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(
                new ClassPathResource(resourcePath).getInputStream(), StandardCharsets.UTF_8))) {
            List<String> words = reader.lines()
                    .map(String::trim)
                    .filter(line -> !line.isEmpty())
                    .toList();

            if (words.isEmpty()) {
                throw new IllegalStateException("Guest username word list is empty: " + resourcePath);
            }
            return words;
        } catch (IOException e) {
            throw new UncheckedIOException("Could not read guest username word list: " + resourcePath, e);
        }
    }
}
