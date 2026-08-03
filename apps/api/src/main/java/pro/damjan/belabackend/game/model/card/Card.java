package pro.damjan.belabackend.game.model.card;

import lombok.Getter;
import lombok.Setter;

import java.io.Serializable;

@Getter @Setter
public class Card implements Serializable {

    private final Suite suite;
    private final Rank rank;

    // Not Donald
    private boolean isTrump;
    private boolean isHidden;

    public Card(Suite suite, Rank rank, boolean isTrump) {
        this.suite = suite;
        this.rank = rank;
        this.isTrump = isTrump;
    }

    /**
     * Determines if this card is stronger than the other card, based on the rules of Belote.
     *
     * @param previousCard the card to compare against (the card that is strongest)
     * @return true if this card is stronger than the previous card, false otherwise
     */
    public boolean isStrongerThan(Card previousCard) {
        if (this.isTrump && !previousCard.isTrump) {
            return true; // trump beats non-trump
        } else if (!this.isTrump && previousCard.isTrump) {
            return false; // non-trump loses to trump
        } else if (this.suite == previousCard.suite) {
            // Compare by rank strength, not point value: equal-point ranks (e.g. 9, 8, 7)
            // still have a strict beating order.
            return this.getStrength() > previousCard.getStrength();
        }

        return false; // different non-trump suits cannot beat each other
    }

    public int getStrength() {
        return rank.getStrength(isTrump);
    }

    public int getPoints() {
        return rank.getPoints(isTrump);
    }
}
