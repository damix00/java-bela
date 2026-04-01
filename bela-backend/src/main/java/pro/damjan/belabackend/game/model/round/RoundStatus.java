package pro.damjan.belabackend.game.model.round;

import java.io.Serializable;

public enum RoundStatus implements Serializable {
    CHOOSING_TRUMP,
    DECLARATIONS,
    PLAYING,
    FINISHED
}
