package pro.damjan.belabackend.user.username;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.core.io.ClassPathResource;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.regex.Pattern;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class GuestUsernameGeneratorTest {

    /** The frontend caps usernames at 16 characters. */
    private static final int FRONTEND_USERNAME_MAX = 16;
    private static final Pattern DEFAULT_NAME = Pattern.compile("^[A-Z][a-z]{2,5}[A-Z][a-z]{2,5}\\d{4}$");

    private GuestUsernameGenerator guestUsernameGenerator;

    @BeforeEach
    void setUp() {
        guestUsernameGenerator = new GuestUsernameGenerator();
    }

    @Test
    void generatesNamesInAdjectiveNounNumberShape() {
        for (int i = 0; i < 500; i++) {
            assertThat(guestUsernameGenerator.generate(4)).matches(DEFAULT_NAME);
        }
    }

    @ParameterizedTest
    @ValueSource(ints = {1, 4, 6, 8})
    void honoursRequestedSuffixLengthWithZeroPadding(int suffixDigits) {
        Pattern expected = Pattern.compile("^[A-Z][a-z]+[A-Z][a-z]+\\d{" + suffixDigits + "}$");

        for (int i = 0; i < 200; i++) {
            assertThat(guestUsernameGenerator.generate(suffixDigits)).matches(expected);
        }
    }

    @Test
    void rejectsNonPositiveSuffixLength() {
        assertThatThrownBy(() -> guestUsernameGenerator.generate(0))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void clearsTheRequiredCombinationFloor() {
        assertThat(guestUsernameGenerator.combinationCount())
                .isGreaterThanOrEqualTo(GuestUsernameGenerator.MINIMUM_COMBINATIONS);
    }

    @Test
    void refusesWordListsTooSmallToReachTheFloor() {
        assertThatThrownBy(() -> new GuestUsernameGenerator(List.of("swift"), List.of("falcon")))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("combinations");
    }

    @Test
    void wordListsAreCleanAndDeduplicated() throws IOException {
        for (String resource : List.of("usernames/adjectives.txt", "usernames/nouns.txt")) {
            List<String> words = readWords(resource);

            assertThat(words).as(resource).doesNotHaveDuplicates();
            assertThat(words).as(resource).allMatch(word -> word.matches("^[a-z]{3,6}$"), "lowercase, 3-6 letters");
        }
    }

    @Test
    void everyPossibleDefaultNameFitsTheFrontendLimit() throws IOException {
        int longestAdjective = longestWordLength("usernames/adjectives.txt");
        int longestNoun = longestWordLength("usernames/nouns.txt");

        assertThat(longestAdjective + longestNoun + GuestUsernameGenerator.BASELINE_SUFFIX_DIGITS)
                .isLessThanOrEqualTo(FRONTEND_USERNAME_MAX);
    }

    @Test
    void producesABroadSpreadOfDistinctNames() {
        Set<String> generated = new HashSet<>();
        for (int i = 0; i < 1_000; i++) {
            generated.add(guestUsernameGenerator.generate(4));
        }

        // Collisions in a billion-name space should be vanishingly rare.
        assertThat(generated).hasSizeGreaterThan(995);
    }

    @Test
    void hexFallbackKeepsTheAdjectiveNounShape() {
        assertThat(guestUsernameGenerator.generateWithHexSuffix())
                .matches("^[A-Z][a-z]+[A-Z][a-z]+[0-9a-f]+$");
    }

    private static List<String> readWords(String resource) throws IOException {
        return new String(new ClassPathResource(resource).getInputStream().readAllBytes(), StandardCharsets.UTF_8)
                .lines()
                .map(String::trim)
                .filter(line -> !line.isEmpty())
                .toList();
    }

    private static int longestWordLength(String resource) throws IOException {
        return readWords(resource).stream().mapToInt(String::length).max().orElseThrow();
    }
}
