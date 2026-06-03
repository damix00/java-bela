package pro.damjan.belabackend.game.model.round;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;
import pro.damjan.belabackend.game.model.card.Card;
import pro.damjan.belabackend.game.model.card.Declaration;
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
    private Trick currentTrick;
    private RoundTeam team1 = new RoundTeam();
    private RoundTeam team2 = new RoundTeam();

    private List<Trick> tricksOrEmpty() {
        if (tricks == null) {
            tricks = new ArrayList<>();
        }

        return tricks;
    }

    public BeloteRound(int roundNumber, int startingPlayerIndex, RoundStatus roundStatus) {
        this.roundNumber = roundNumber;
        this.startingPlayerIndex = startingPlayerIndex;
        this.roundStatus = roundStatus;

        this.currentTurnIndex = startingPlayerIndex;
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

    public void startNewTrick() {
        if (currentTrick != null && !currentTrick.isComplete()) {
            throw new IllegalStateException("Cannot start a new trick while the current trick is still active");
        }

        currentTrick = new Trick();
        currentTrick.setTrickNumber(++currentTrickNumber);

        tricksOrEmpty().add(currentTrick);
    }

    public Trick getTrick(int trickNumber) {
        return tricksOrEmpty()
                .stream()
                .filter(trick -> trick.getTrickNumber() == trickNumber)
                .findFirst()
                .orElseThrow(() -> new IllegalStateException("Trick not found: " + trickNumber));
    }

    public CardThrowResult throwCard(GamePlayer gamePlayer, Card card) {
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

        boolean bela = awardBelaIfCompleted(gamePlayer.getSeatIndex(), card);

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
     * Bela (King + Queen of the trump suite) is announced on play: the +20 is awarded to the
     * player's team at the moment they play the second of the two trump cards during tricks.
     * Returns true if this card completed the bela.
     */
    private boolean awardBelaIfCompleted(int seatIndex, Card card) {
        if (trumpSuite == null || card.getSuite() != trumpSuite) {
            return false;
        }
        if (card.getRank() != Rank.KING && card.getRank() != Rank.QUEEN) {
            return false;
        }

        Rank partnerRank = card.getRank() == Rank.KING ? Rank.QUEEN : Rank.KING;
        Card partnerCard = findPlayedCard(seatIndex, trumpSuite, partnerRank);
        if (partnerCard == null) {
            return false; // the other half of the bela has not been played yet
        }

        List<Card> belaCards = new ArrayList<>();
        if (card.getRank() == Rank.KING) {
            belaCards.add(card);
            belaCards.add(partnerCard);
        } else {
            belaCards.add(partnerCard);
            belaCards.add(card);
        }

        getRoundTeamForPlayerIndex(seatIndex)
                .addDeclaration(new Declaration(Declaration.Type.BELA, seatIndex, belaCards));
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

    public int getTeam1RoundScore() {
        return getFinalRoundScore(0);
    }

    public int getTeam2RoundScore() {
        return getFinalRoundScore(1);
    }

    private int getFinalRoundScore(int teamIndex) {
        if (roundStatus != RoundStatus.FINISHED) {
            return getRoundTeam(teamIndex).getPoints();
        }

        int callerTeamIndex = team1.isCalledTrump() ? 0 : team2.isCalledTrump() ? 1 : -1;
        if (callerTeamIndex == -1) {
            return getRoundTeam(teamIndex).getPoints();
        }

        RoundTeam caller = getRoundTeam(callerTeamIndex);
        RoundTeam other = getRoundTeam(1 - callerTeamIndex);
        int totalPoints = caller.getPoints() + other.getPoints();

        // The calling team must win MORE than half the points; an exact tie means they fall (pao).
        if (caller.getPoints() * 2 > totalPoints) {
            return getRoundTeam(teamIndex).getPoints();
        }

        // Caller fell (pao): the opposing team takes everything on the table,
        // including all card points and the declarations of both teams.
        if (teamIndex == callerTeamIndex) {
            return 0;
        }

        return totalPoints;
    }
}
