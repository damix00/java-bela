package pro.damjan.belabackend.game.model.round;

import lombok.Getter;
import lombok.Setter;

import java.io.Serializable;

/**
 * Team-level state for a single round. Holds only what is genuinely team-scoped and not derivable
 * elsewhere: the card points accumulated from won tricks (plus the +10 last-trick and +90 sweep
 * bonuses) and whether this team called the trump. Declarations live per-player on
 * {@link RoundPlayer}; declaration totals are derived at the {@link BeloteRound} level.
 */
@Getter
public class RoundTeam implements Serializable {

    private int cardPoints; // Points from cards won in tricks

    @Setter
    private boolean calledTrump; // Whether this team called the trump suite for this round

    public int getPoints() {
        return cardPoints;
    }

    public void addCardPoints(int points) {
        if (points < 0) {
            throw new IllegalArgumentException("Points to add cannot be negative");
        }

        this.cardPoints += points;
    }
}
