package pro.damjan.belabackend.game.model.config;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatIllegalArgumentException;

class GameConfigurationTest {

    @Test
    void matchTypesUseTheirExpectedTargetScores() {
        assertThat(GameConfiguration.forMatchType(MatchType.RANKED, 42))
                .isEqualTo(GameConfiguration.ranked());
        assertThat(GameConfiguration.forMatchType(MatchType.CASUAL, 42))
                .isEqualTo(GameConfiguration.casual());
        assertThat(GameConfiguration.forMatchType(MatchType.PRIVATE, 701))
                .isEqualTo(GameConfiguration.privateGame(701));
    }

    @Test
    void privateGameRequiresPositiveTargetScore() {
        assertThatIllegalArgumentException()
                .isThrownBy(() -> GameConfiguration.privateGame(0))
                .withMessage("targetScore must be > 0");
    }
}
