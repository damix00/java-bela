package pro.damjan.belabackend.game.model.card;

import lombok.Getter;
import lombok.Setter;

import java.io.Serializable;
import java.util.ArrayList;
import java.util.List;

@Getter @Setter
public class Declaration implements Serializable {
    public enum Type {
        BELOTE(162),
        BELA(20), // King and Queen of trump suite

        SEQUENCE_3(20), // 3 in a row
        SEQUENCE_4(50), // 4 in a row
        SEQUENCE_5(100), // 5-7 in a row

        FOUR_JACKS(200), // 4 Jacks
        FOUR_NINES(150), // 4 Nines
        FOUR_OF_A_KIND(100); // 4 same cards

        @Getter
        private final int points;

        Type(int points) {
            this.points = points;
        }
    }

    private Type type;
    private int playerIndex = -1;
    private List<Card> cards = new ArrayList<>();

    public Declaration() {}

    public Declaration(Type type, int playerIndex, List<Card> cards) {
        this.type = type;
        this.playerIndex = playerIndex;
        this.cards = new ArrayList<>(cards);
    }

    public int getPoints() {
        return type == null ? 0 : type.getPoints();
    }
}
