package pro.damjan.belabackend.game.model.config;

import java.io.Serializable;
import java.util.Objects;

public record GameConfiguration(
    MatchType matchType,
    int targetScore
) implements Serializable {

    public GameConfiguration(MatchType matchType, int targetScore) {
        Objects.requireNonNull(matchType, "matchType must not be null");
        if (targetScore <= 0) {
            throw new IllegalArgumentException("targetScore must be > 0");
        }

        this.matchType = matchType;
        this.targetScore = targetScore;
    }

    public static GameConfiguration ranked() {
        return new GameConfiguration(MatchType.RANKED, 1001);
    }

    public static GameConfiguration casual() {
        return new GameConfiguration(MatchType.CASUAL, 501);
    }

    public static GameConfiguration privateGame(int targetScore) {
        return new GameConfiguration(MatchType.PRIVATE, targetScore);
    }

    public static GameConfiguration forMatchType(MatchType matchType, int privateTargetScore) {
        return switch (Objects.requireNonNull(matchType, "matchType must not be null")) {
            case RANKED -> ranked();
            case CASUAL -> casual();
            case PRIVATE -> privateGame(privateTargetScore);
        };
    }
}
