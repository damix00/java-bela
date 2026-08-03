package pro.damjan.belabackend.user.auth.refresh;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class TokenHasherTest {

    @Test
    void producesAStable64CharHexDigest() {
        String hash = TokenHasher.sha256Hex("some-token");

        assertThat(hash).hasSize(64).matches("[0-9a-f]+");
        assertThat(TokenHasher.sha256Hex("some-token")).isEqualTo(hash);
    }

    @Test
    void avalanchesOnASingleCharacterChange() {
        assertThat(TokenHasher.sha256Hex("some-token"))
                .isNotEqualTo(TokenHasher.sha256Hex("some-tokeo"));
    }

    @Test
    void generatesDistinctUrlSafeTokens() {
        String a = TokenHasher.generateToken();
        String b = TokenHasher.generateToken();

        assertThat(a).isNotEqualTo(b);
        assertThat(a).hasSize(43).matches("[A-Za-z0-9_-]+");
    }
}
