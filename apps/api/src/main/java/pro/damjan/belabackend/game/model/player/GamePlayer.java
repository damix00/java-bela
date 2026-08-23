package pro.damjan.belabackend.game.model.player;

import lombok.Getter;
import lombok.Setter;
import pro.damjan.belabackend.game.model.card.Card;
import pro.damjan.belabackend.game.model.card.Suite;

import java.io.Serializable;
import java.util.ArrayList;
import java.util.List;

@Getter
public class GamePlayer implements Serializable {

    private String userId;

    @Setter
    private int seatIndex; // 0-3, determines turn order and team (0,2 - team1, 1,3 - team2)

    private boolean bot;

    // Carried over from the lobby seat so a game snapshot can name a player
    // without the client having to look them up.
    private String username;

    private String avatarUrl;

    private List<Card> hand = new ArrayList<>();

    // Used only for serialization/deserialization
    public GamePlayer() {}

    public GamePlayer(String userId) {
        this.userId = userId;
    }

    public GamePlayer(String userId, int seatIndex) {
        this.userId = userId;
        this.seatIndex = seatIndex;
    }

    public GamePlayer(String userId, int seatIndex, boolean bot) {
        this.userId = userId;
        this.seatIndex = seatIndex;
        this.bot = bot;
    }

    public GamePlayer(String userId, int seatIndex, boolean bot, String username, String avatarUrl) {
        this(userId, seatIndex, bot);
        this.username = username;
        this.avatarUrl = avatarUrl;
    }

    public void receiveCards(List<Card> cards) {
        this.hand = new ArrayList<>(cards);
    }

    public void removeCard(Card card) {
        hand.remove(card);
    }

    public void updateTrumpSuite(Suite trumpSuite) {
        for (Card card : hand) {
            card.setTrump(card.getSuite() == trumpSuite);
        }
    }

    public int getTeamIndex() {
        return seatIndex % 2; // 0 for team1 (seats 0 and 2), 1 for team2 (seats 1 and 3)
    }
}
