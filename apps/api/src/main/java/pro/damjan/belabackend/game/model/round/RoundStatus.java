package pro.damjan.belabackend.game.model.round;

import java.io.Serializable;

public enum RoundStatus implements Serializable {
    CHOOSING_TRUMP,
    // The private question: every player is asked whether they declare their zvanja. Nothing
    // about anyone's hand leaves the server while the round sits here.
    DECLARING,
    // The public answer: the resolved sets are on the table for everyone to see.
    DECLARATIONS,
    PLAYING,
    FINISHED
}
