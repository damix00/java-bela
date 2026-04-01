package pro.damjan.belabackend.game.model.round;

import lombok.Getter;
import lombok.Setter;
import pro.damjan.belabackend.game.model.card.Declaration;

import java.io.Serializable;
import java.util.List;

public class RoundTeam implements Serializable {

    private int cardPoints; // Points from cards won in tricks

    @Getter
    private List<Declaration> declarations;
    @Getter @Setter
    private boolean calledTrump; // Whether this team called the trump suite for this round

    public int getPoints() {
        int declarationPoints = declarations.stream().mapToInt(d -> d.getType().getPoints()).sum();
        return cardPoints + declarationPoints;
    }

    public void addCardPoints(int points) {
        if (points < 0) {
            throw new IllegalArgumentException("Points to add cannot be negative");
        }
        
        this.cardPoints += points;
    }
}
