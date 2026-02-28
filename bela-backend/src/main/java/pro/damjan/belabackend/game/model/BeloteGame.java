package pro.damjan.belabackend.game.model;

import jakarta.persistence.Id;
import lombok.Getter;
import lombok.Setter;
import org.springframework.data.redis.core.RedisHash;
import org.springframework.data.redis.core.TimeToLive;
import pro.damjan.belabackend.game.model.card.CardSuite;
import pro.damjan.belabackend.game.model.card.PlayedCard;

import java.io.Serializable;
import java.util.List;

@Getter @Setter
@RedisHash("BeloteGame")
public class BeloteGame implements Serializable {
    @Id
    private String id;

    private List<PlayedCard> cardsOnTable;
    private CardSuite trumpSuite;
    private GameStatus status;

    // List of players in the game (exactly 4)
    // Order is Team A - Team B - Team A - Team B
    private List<GamePlayer> players;

    private List<Team> teams;

    // Index of the player whose turn it is (0-3)
    private int currentTurn;

    @TimeToLive
    private long ttl = 3600; // 1 hour in seconds
}
