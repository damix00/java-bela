package pro.damjan.belabackend.game.model;

import lombok.Getter;
import lombok.Setter;
import pro.damjan.belabackend.game.model.card.Card;

import java.io.Serializable;
import java.util.List;

@Getter @Setter
public class GamePlayer implements Serializable {

    private String userId;
    private String teamId;

    private List<Card> deck;

}
