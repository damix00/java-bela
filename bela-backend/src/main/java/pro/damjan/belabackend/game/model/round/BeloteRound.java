package pro.damjan.belabackend.game.model.round;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;
import pro.damjan.belabackend.game.model.card.Card;
import pro.damjan.belabackend.game.model.card.Declaration;
import pro.damjan.belabackend.game.model.card.DeclarationResolver;
import pro.damjan.belabackend.game.model.card.Rank;
import pro.damjan.belabackend.game.model.card.Suite;
import pro.damjan.belabackend.game.model.player.GamePlayer;
import pro.damjan.belabackend.game.model.round.trick.PlayedCard;
import pro.damjan.belabackend.game.model.round.trick.Trick;
import pro.damjan.belabackend.game.model.round.trick.TrickValidator;

import java.io.Serializable;
import java.util.ArrayList;
import java.util.List;

@Getter
public class BeloteRound implements Serializable {

    public record CardThrowResult(
            boolean legalMove,
            int trickNumber,
            boolean trickComplete,
            Integer winningPlayerIndex,
            boolean nextTrickPending,
            boolean bela
    ) {}

    private final int roundNumber;

    @Setter
    private RoundStatus roundStatus;

    @Setter
    private Suite trumpSuite;

    private int currentTurnIndex; // index of the player whose turn it is to play (0-3)

    private int startingPlayerIndex = 0; // index of the player who started the current round (0-3)

    private int currentTrickNumber = -1; // 0-based index for tricks within this round
    private List<Trick> tricks; // List of tricks played in this round, in order
    private RoundTeam team1 = new RoundTeam();
    private RoundTeam team2 = new RoundTeam();
    private List<RoundPlayer> roundPlayers; // per-player round state, indexed by seat (0-3)

    private List<Trick> tricksOrEmpty() {
        if (tricks == null) {
            tricks = new ArrayList<>();
        }

        return tricks;
    }

    private List<RoundPlayer> roundPlayersOrEmpty() {
        if (roundPlayers == null || roundPlayers.isEmpty()) {
            List<RoundPlayer> players = new ArrayList<>();
            for (int seat = 0; seat < 4; seat++) {
                players.add(new RoundPlayer(seat));
            }
            roundPlayers = players;
        }

        return roundPlayers;
    }

    public RoundPlayer getRoundPlayer(int seatIndex) {
        if (seatIndex < 0 || seatIndex > 3) {
            throw new IllegalArgumentException("Seat index must be between 0 and 3");
        }
        return roundPlayersOrEmpty().get(seatIndex);
    }

    public List<RoundPlayer> getRoundPlayers() {
        return roundPlayersOrEmpty();
    }

    public BeloteRound(int roundNumber, int startingPlayerIndex, RoundStatus roundStatus) {
        this.roundNumber = roundNumber;
        this.startingPlayerIndex = startingPlayerIndex;
        this.roundStatus = roundStatus;

        this.currentTurnIndex = startingPlayerIndex;
        roundPlayersOrEmpty();
    }

    public boolean isChoosingTrump() {
        return roundStatus == RoundStatus.CHOOSING_TRUMP;
    }

    public boolean isLastTrumpChooser() {
        return currentTurnIndex == (startingPlayerIndex + 3) % 4;
    }

    public void passTrumpChoice() {
        if (!isChoosingTrump()) {
            throw new IllegalStateException("Cannot pass trump choice outside trump choosing phase");
        }

        if (isLastTrumpChooser()) {
            throw new IllegalStateException("Cannot pass trump choice for the last chooser");
        }

        advanceTurn();
    }

    public void chooseTrump(Suite suite) {
        if (!isChoosingTrump()) {
            throw new IllegalStateException("Cannot choose trump outside trump choosing phase");
        }

        this.trumpSuite = suite;
        getRoundTeamForPlayerIndex(currentTurnIndex).setCalledTrump(true);
        this.roundStatus = RoundStatus.DECLARATIONS;
    }

    public void advanceTurn() {
        currentTurnIndex = (currentTurnIndex + 1) % 4;
    }

    public void setCurrentTurnIndex(int turnIndex) {
        if (turnIndex < 0 || turnIndex > 3) {
            throw new IllegalArgumentException("Turn index must be between 0 and 3");
        }
        this.currentTurnIndex = turnIndex;
    }

    /**
     * The current trick is always the last entry in {@link #tricks}. It is derived rather than
     * stored so the value survives a persistence round trip: storing it as a separate field would
     * de-alias it from the list on reload, leaving the list copy frozen and silently corrupting
     * trick-based scoring (bela and the all-tricks sweep bonus).
     */
    public Trick getCurrentTrick() {
        List<Trick> all = tricksOrEmpty();
        return all.isEmpty() ? null : all.getLast();
    }

    public void startNewTrick() {
        Trick current = getCurrentTrick();
        if (current != null && !current.isComplete()) {
            throw new IllegalStateException("Cannot start a new trick while the current trick is still active");
        }

        Trick trick = new Trick();
        trick.setTrickNumber(++currentTrickNumber);

        tricksOrEmpty().add(trick);
    }

    public Trick getTrick(int trickNumber) {
        return tricksOrEmpty()
                .stream()
                .filter(trick -> trick.getTrickNumber() == trickNumber)
                .findFirst()
                .orElseThrow(() -> new IllegalStateException("Trick not found: " + trickNumber));
    }

    public CardThrowResult throwCard(GamePlayer gamePlayer, Card card, boolean declareBela) {
        Trick currentTrick = getCurrentTrick();
        if (currentTrick == null || currentTrick.isComplete()) {
            throw new IllegalStateException("Cannot throw card, no active trick or current trick is already complete");
        }

        if (gamePlayer.getSeatIndex() != currentTurnIndex) {
            throw new IllegalStateException("It's not the player's turn to play");
        }

        if (!TrickValidator.isLegalMove(currentTrick, card, trumpSuite, gamePlayer)) {
            return new CardThrowResult(false, currentTrickNumber, false, null, false, false);
        }

        int playedTrickNumber = currentTrickNumber;

        currentTrick.addCard(new PlayedCard(
                gamePlayer.getSeatIndex(),
                card
        ));

        gamePlayer.removeCard(card);

        boolean bela = awardBelaIfCompleted(gamePlayer.getSeatIndex(), card, declareBela);

        if (currentTrick.isComplete()) {
            int winningPlayerIndex = TrickValidator.determineTrickWinner(currentTrick, trumpSuite);
            currentTrick.setWinningPlayerIndex(winningPlayerIndex);
            getRoundTeamForPlayerIndex(winningPlayerIndex).addCardPoints(currentTrick.calculatePoints());
            currentTurnIndex = winningPlayerIndex;

            if (gamePlayer.getHand().isEmpty()) {
                // add 10 points for winning the last trick
                getRoundTeamForPlayerIndex(winningPlayerIndex).addCardPoints(10);
                awardAllTricksBonusIfApplicable();
                roundStatus = RoundStatus.FINISHED;
                return new CardThrowResult(true, playedTrickNumber, true, winningPlayerIndex, false, bela);
            }

            return new CardThrowResult(true, playedTrickNumber, true, winningPlayerIndex, true, bela);
        }

        advanceTurn();
        return new CardThrowResult(true, playedTrickNumber, false, null, false, bela);
    }

    /**
     * Bela (King + Queen of the trump suite) is optional and announced on play. A player declaring
     * on either trump K/Q throw records the intent (OR-accumulated). The +20 is awarded — by
     * appending a {@code BELA} declaration to that player's {@link RoundPlayer} — at the moment they
     * complete the pair, but only if they declared. Returns true if this card awarded the bela.
     */
    private boolean awardBelaIfCompleted(int seatIndex, Card card, boolean declareBela) {
        if (trumpSuite == null || card.getSuite() != trumpSuite) {
            return false;
        }
        if (card.getRank() != Rank.KING && card.getRank() != Rank.QUEEN) {
            return false;
        }

        RoundPlayer roundPlayer = getRoundPlayer(seatIndex);
        if (declareBela) {
            roundPlayer.setBelaDeclared(true);
        }

        Rank partnerRank = card.getRank() == Rank.KING ? Rank.QUEEN : Rank.KING;
        Card partnerCard = findPlayedCard(seatIndex, trumpSuite, partnerRank);
        if (partnerCard == null) {
            return false; // the other half of the bela has not been played yet
        }

        if (!roundPlayer.isBelaDeclared()) {
            return false; // pair completed but the player chose not to declare
        }

        List<Card> belaCards = new ArrayList<>();
        if (card.getRank() == Rank.KING) {
            belaCards.add(card);
            belaCards.add(partnerCard);
        } else {
            belaCards.add(partnerCard);
            belaCards.add(card);
        }

        roundPlayer.addDeclaration(new Declaration(Declaration.Type.BELA, seatIndex, belaCards));
        return true;
    }

    private Card findPlayedCard(int seatIndex, Suite suite, Rank rank) {
        for (Trick trick : tricksOrEmpty()) {
            for (PlayedCard playedCard : trick.getPlayedCards()) {
                if (playedCard.getPlayerIndex() == seatIndex
                        && playedCard.getCard().getSuite() == suite
                        && playedCard.getCard().getRank() == rank) {
                    return playedCard.getCard();
                }
            }
        }
        return null;
    }

    /** Štiglja: a team that wins all eight tricks earns a +90 bonus. */
    private void awardAllTricksBonusIfApplicable() {
        List<Trick> allTricks = tricksOrEmpty();
        if (allTricks.size() < 8) {
            return;
        }

        int sweepingTeam = allTricks.getFirst().getWinningPlayerIndex() % 2;
        boolean sweep = allTricks.stream()
                .allMatch(trick -> trick.getWinningPlayerIndex() % 2 == sweepingTeam);
        if (sweep) {
            getRoundTeam(sweepingTeam).addCardPoints(90);
        }
    }

    public RoundTeam getRoundTeam(int teamIndex) {
        if (teamIndex == 0) {
            return team1;
        }
        if (teamIndex == 1) {
            return team2;
        }
        throw new IllegalArgumentException("Team index must be 0 or 1");
    }

    public RoundTeam getRoundTeamForPlayerIndex(int playerIndex) {
        if (playerIndex < 0 || playerIndex > 3) {
            throw new IllegalArgumentException("Player index must be between 0 and 3");
        }
        return getRoundTeam(playerIndex % 2);
    }

    /** Detects each player's declarations from their hand and stores them on their {@link RoundPlayer}. */
    public void seedDeclarations(List<GamePlayer> players) {
        for (GamePlayer player : players) {
            getRoundPlayer(player.getSeatIndex()).setDeclarations(DeclarationResolver.detect(player));
        }
    }

    /** Records that a player opts out of declaring; their declarations drop from the contest. */
    public void declineDeclarations(int seatIndex) {
        getRoundPlayer(seatIndex).setChoosesToDeclare(false);
    }

    /** True if any player holds a non-belot declaration that could be declared (drives the phase). */
    public boolean hasDeclarations() {
        return roundPlayersOrEmpty().stream()
                .flatMap(player -> player.getDeclarations().stream())
                .anyMatch(declaration -> declaration.getType() != Declaration.Type.BELOTE);
    }

    /** True if any player holds a belot (all 8 trump cards), which ends the round immediately. */
    public boolean hasBelot() {
        return roundPlayersOrEmpty().stream()
                .flatMap(player -> player.getDeclarations().stream())
                .anyMatch(declaration -> declaration.getType() == Declaration.Type.BELOTE);
    }

    /**
     * Resolves the zvanja contest over only the players who chose to declare (bela excluded — it is
     * non-contested). The resolver decides which team's zvanja score and, for belot, returns only the
     * belot itself, so we defer to its per-team lists rather than re-deriving them here.
     */
    private DeclarationResolver.Result resolveDeclarations() {
        List<DeclarationResolver.PlayerDeclarations> declaring = roundPlayersOrEmpty().stream()
                .filter(RoundPlayer::isChoosesToDeclare)
                .map(player -> new DeclarationResolver.PlayerDeclarations(
                        player.getPlayerIndex(),
                        player.getPlayerIndex() % 2,
                        player.getDeclarations().stream()
                                .filter(declaration -> declaration.getType() != Declaration.Type.BELA)
                                .toList()
                ))
                .toList();

        return DeclarationResolver.resolveFrom(declaring, startingPlayerIndex);
    }

    /**
     * Declarations shown/scored for a team: the zvanja awarded by the resolver (only the winning
     * team's, and only the belot for a belot hand), plus that team's bela declarations, which are
     * always scored per-team regardless of the contest.
     */
    public List<Declaration> getDeclarations(int teamIndex) {
        DeclarationResolver.Result result = resolveDeclarations();
        List<Declaration> declarations = new ArrayList<>(
                teamIndex == 0 ? result.team1Declarations() : result.team2Declarations());

        for (RoundPlayer player : roundPlayersOrEmpty()) {
            if (player.getPlayerIndex() % 2 != teamIndex) {
                continue;
            }
            player.getDeclarations().stream()
                    .filter(declaration -> declaration.getType() == Declaration.Type.BELA)
                    .forEach(declarations::add);
        }

        return declarations;
    }

    private int getDeclarationPoints(int teamIndex) {
        return getDeclarations(teamIndex).stream().mapToInt(Declaration::getPoints).sum();
    }

    public int getTeamPoints(int teamIndex) {
        return getRoundTeam(teamIndex).getPoints() + getDeclarationPoints(teamIndex);
    }

    public int getTeam1RoundScore() {
        return getFinalRoundScore(0);
    }

    public int getTeam2RoundScore() {
        return getFinalRoundScore(1);
    }

    private int getFinalRoundScore(int teamIndex) {
        if (roundStatus != RoundStatus.FINISHED) {
            return getTeamPoints(teamIndex);
        }

        int callerTeamIndex = team1.isCalledTrump() ? 0 : team2.isCalledTrump() ? 1 : -1;
        if (callerTeamIndex == -1) {
            return getTeamPoints(teamIndex);
        }

        int callerPoints = getTeamPoints(callerTeamIndex);
        int otherPoints = getTeamPoints(1 - callerTeamIndex);
        int totalPoints = callerPoints + otherPoints;

        // The calling team must win MORE than half the points; an exact tie means they fall (pao).
        if (callerPoints * 2 > totalPoints) {
            return getTeamPoints(teamIndex);
        }

        // Caller fell (pao): the opposing team takes everything on the table,
        // including all card points and the declarations of both teams.
        if (teamIndex == callerTeamIndex) {
            return 0;
        }

        return totalPoints;
    }
}
