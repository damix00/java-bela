package pro.damjan.belabackend.game.model.round.trick;

import lombok.Getter;
import lombok.RequiredArgsConstructor;
import pro.damjan.belabackend.game.model.card.Card;

import java.io.Serializable;

@Getter
@RequiredArgsConstructor
public class PlayedCard implements Serializable {

    private final int playerIndex; // index of the player who played the card (0-3)
    private final Card card; // the card that was played

}
