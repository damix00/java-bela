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

    /**
     * Relative strength of this rank within its suite, used to decide which card beats which.
     * Higher is stronger. This is distinct from point value: several ranks share a point value
     * (e.g. non-trump 9, 8 and 7 are all worth 0) yet still have a strict beating order.
     *
     * Non-trump order (high to low): A, 10, K, Q, J, 9, 8, 7.
     * Trump order (high to low):     J, 9, A, 10, K, Q, 8, 7.
     */
    public int getStrength(boolean isTrump) {
        return isTrump ? trumpStrength() : normalStrength();
    }

    private int normalStrength() {
        return switch (this) {
            case ACE -> 7;
            case TEN -> 6;
            case KING -> 5;
            case QUEEN -> 4;
            case JACK -> 3;
            case NINE -> 2;
            case EIGHT -> 1;
            case SEVEN -> 0;
        };
    }

    private int trumpStrength() {
        return switch (this) {
            case JACK -> 7;
            case NINE -> 6;
            case ACE -> 5;
            case TEN -> 4;
            case KING -> 3;
            case QUEEN -> 2;
            case EIGHT -> 1;
            case SEVEN -> 0;
        };
    }
}
