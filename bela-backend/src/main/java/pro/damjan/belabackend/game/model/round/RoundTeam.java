package pro.damjan.belabackend.game.model.round;

import lombok.Getter;
import lombok.Setter;
import pro.damjan.belabackend.game.model.card.Declaration;

import java.io.Serializable;
import java.util.ArrayList;
import java.util.List;

@Getter
public class RoundTeam implements Serializable {

    private int cardPoints; // Points from cards won in tricks

    @Setter
    private List<Declaration> declarations = new ArrayList<>();
    @Setter
    private boolean calledTrump; // Whether this team called the trump suite for this round

    public int getPoints() {
        return cardPoints + getDeclarationPoints();
    }

    public int getDeclarationPoints() {
        return declarations == null
                ? 0
                : declarations.stream().mapToInt(Declaration::getPoints).sum();
    }

    public void addCardPoints(int points) {
        if (points < 0) {
            throw new IllegalArgumentException("Points to add cannot be negative");
        }
        
        this.cardPoints += points;
    }
}
