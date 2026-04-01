package pro.damjan.belabackend.game.model.card;

import java.io.Serializable;

public enum Rank implements Serializable {
    SEVEN(0),
    EIGHT(0),
    NINE(0, 14),
    TEN(10),
    JACK(2, 20),
    QUEEN(3),
    KING(4),
    ACE(11);

    private final int normalPoints;
    private final int trumpPoints;

    Rank(int points) {
        this.normalPoints = points;
        this.trumpPoints = points;
    }

    Rank(int normalPoints, int trumpPoints) {
        this.normalPoints = normalPoints;
        this.trumpPoints = trumpPoints;
    }

    public int getPoints(boolean isTrump) {
        return isTrump ? trumpPoints : normalPoints;
    }
}
