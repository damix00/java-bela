package pro.damjan.belabackend.game.model.round;

import lombok.Getter;
import lombok.Setter;
import pro.damjan.belabackend.game.model.card.Declaration;

import java.io.Serializable;
import java.util.ArrayList;
import java.util.List;

/**
 * Per-player state scoped to a single round. Consolidates the choices and declarations that used
 * to be scattered across {@link RoundTeam} and inferred from the trick history. The player's hand
 * stays on {@code GamePlayer}; only round-scoped state lives here.
 */
@Getter
public class RoundPlayer implements Serializable {

    private int playerIndex;

    /**
     * Whether this player declares the declarations (zvanja) they hold. Defaults to {@code true};
     * a player may opt out during the declarations phase. A player who declines is dropped from the
     * declaration contest entirely.
     */
    @Setter
    private boolean choosesToDeclare = true;

    /**
     * Declarations belonging to this player: the zvanja detected from their hand when trump is
     * chosen, plus a {@code BELA} entry appended when they complete (and declared) the K+Q of trump.
     */
    private List<Declaration> declarations = new ArrayList<>();

    /**
     * Whether this player declared bela. OR-accumulated across the two trump K/Q throws, so
     * declaring on either the first or the second card counts.
     */
    @Setter
    private boolean belaDeclared;

    public RoundPlayer() {}

    public RoundPlayer(int playerIndex) {
        this.playerIndex = playerIndex;
    }

    public void setDeclarations(List<Declaration> declarations) {
        this.declarations = declarations == null ? new ArrayList<>() : new ArrayList<>(declarations);
    }

    public void addDeclaration(Declaration declaration) {
        if (declarations == null) {
            declarations = new ArrayList<>();
        }
        declarations.add(declaration);
    }
}
