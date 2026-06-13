package pro.damjan.belabackend.game.service.play;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import pro.damjan.belabackend.game.events.BeloteGameEventPublisher;
import pro.damjan.belabackend.game.model.BeloteGame;
import pro.damjan.belabackend.game.model.card.Card;
import pro.damjan.belabackend.game.model.card.Rank;
import pro.damjan.belabackend.game.model.card.Suite;
import pro.damjan.belabackend.game.model.player.GamePlayer;
import pro.damjan.belabackend.game.model.round.RoundStatus;
import pro.damjan.belabackend.game.model.round.trick.Trick;
import pro.damjan.belabackend.game.model.round.trick.TrickValidator;
import pro.damjan.belabackend.game.scheduling.registry.ScheduledTaskRegistry;
import pro.damjan.belabackend.game.scheduling.tasks.ScheduledGameTask;
import pro.damjan.belabackend.game.scheduling.tasks.ScheduledTaskType;
import pro.damjan.belabackend.game.service.access.GameAccessService;

import java.time.Duration;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class CardPlayService {

    public static final Duration CARD_THROW_TIMEOUT = Duration.ofSeconds(30);

    private static final Duration BOT_THROW_DELAY = Duration.ofSeconds(1);
    private static final Duration NEXT_TRICK_DELAY = Duration.ofSeconds(3);

    private final GameAccessService gameAccessService;
    private final BeloteGameEventPublisher gamePublisher;
    private final ScheduledTaskRegistry scheduledTaskRegistry;
    private final GameFlowService gameFlowService;

    public void throwCard(String userId, Suite suite, Rank rank) {
        BeloteGame game = gameAccessService.requireUserGame(userId);

        var round = game.getCurrentRound();
        if (round == null || round.getRoundStatus() != RoundStatus.PLAYING) {
            throw new IllegalStateException("Round is not accepting cards");
        }

        GamePlayer player = game.getPlayer(round.getCurrentTurnIndex());
        if (!player.getUserId().equals(userId)) {
            throw new IllegalStateException("It is not this player's turn to throw a card");
        }

        Card card = findPlayableCard(player, suite, rank);
        throwCard(game, player, card, false);
    }

    public void handleCardThrowTimeout(String gameId, int roundNumber, int trickNumber, int turnIndex) {
        BeloteGame game = gameAccessService.requireGameById(gameId);

        var round = game.getCurrentRound();
        if (round == null
                || round.getRoundStatus() != RoundStatus.PLAYING
                || round.getRoundNumber() != roundNumber
                || round.getCurrentTrickNumber() != trickNumber
                || round.getCurrentTrick() == null
                || round.getCurrentTrick().isComplete()
                || round.getCurrentTurnIndex() != turnIndex) {
            return;
        }

        GamePlayer player = game.getPlayer(turnIndex);
        Card card = chooseCardForTimeout(round.getCurrentTrick(), round.getTrumpSuite(), player);
        throwCard(game, player, card, true);
    }

    private void throwCard(BeloteGame game, GamePlayer player, Card card, boolean expired) {
        var round = game.getCurrentRound();
        int roundNumber = round.getRoundNumber();

        var result = round.throwCard(player, card);
        if (!result.legalMove()) {
            throw new IllegalStateException("Illegal card throw");
        }

        if (round.getRoundStatus() == RoundStatus.FINISHED) {
            game.finishCurrentRoundScoring();
        }

        gameAccessService.save(game);

        long timeoutSeconds =
                round.getRoundStatus() == RoundStatus.PLAYING && !result.nextTrickPending()
                        ? CARD_THROW_TIMEOUT.toSeconds()
                        : 0;
        long pendingDelaySeconds;
        if (result.nextTrickPending()) {
            pendingDelaySeconds = NEXT_TRICK_DELAY.toSeconds();
        } else if (round.getRoundStatus() == RoundStatus.FINISHED) {
            pendingDelaySeconds = GameFlowService.NEXT_ROUND_DELAY.toSeconds();
        } else {
            pendingDelaySeconds = 0;
        }
        gamePublisher.cardThrown(
                game,
                roundNumber,
                result.trickNumber(),
                player.getSeatIndex(),
                card,
                expired,
                result.trickComplete(),
                result.nextTrickPending(),
                result.winningPlayerIndex(),
                timeoutSeconds,
                pendingDelaySeconds,
                result.bela()
        );

        if (round.getRoundStatus() == RoundStatus.FINISHED) {
            gameFlowService.endGameOrScheduleNextRound(game, roundNumber);
            return;
        }

        if (round.getRoundStatus() != RoundStatus.PLAYING) {
            return;
        }

        if (result.nextTrickPending()) {
            scheduleNextTrickStart(game, result.trickNumber(), result.winningPlayerIndex());
            return;
        }

        playBotTurnOrSchedule(game);
    }

    public void handleNextTrickStart(String gameId, int roundNumber, int completedTrickNumber, int winningTurnIndex) {
        BeloteGame game = gameAccessService.requireGameById(gameId);

        var round = game.getCurrentRound();
        if (round == null
                || round.getRoundStatus() != RoundStatus.PLAYING
                || round.getRoundNumber() != roundNumber
                || round.getCurrentTrickNumber() != completedTrickNumber
                || round.getCurrentTurnIndex() != winningTurnIndex
                || round.getCurrentTrick() == null
                || !round.getCurrentTrick().isComplete()) {
            return;
        }

        round.startNewTrick();

        gameAccessService.save(game);
        gamePublisher.cardTurnStarted(game, CARD_THROW_TIMEOUT.toSeconds());
        playBotTurnOrSchedule(game);
    }

    public void playBotTurnOrSchedule(BeloteGame game) {
        var round = game.getCurrentRound();
        if (round == null || round.getRoundStatus() != RoundStatus.PLAYING) {
            return;
        }

        GamePlayer player = game.getPlayer(round.getCurrentTurnIndex());

        if (player.isBot()) {
            scheduleCardThrow(game, BOT_THROW_DELAY);
        } else {
            scheduleCardThrow(game, CARD_THROW_TIMEOUT);
        }
    }

    private Card findPlayableCard(GamePlayer player, Suite suite, Rank rank) {
        if (suite == null || rank == null) {
            throw new IllegalArgumentException("Card suite and rank are required");
        }

        return player.getHand()
                .stream()
                .filter(card -> !card.isHidden())
                .filter(card -> card.getSuite() == suite && card.getRank() == rank)
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Player does not have this card"));
    }

    private Card chooseCardForTimeout(Trick currentTrick, Suite trumpSuite, GamePlayer player) {
        return player.getHand()
                .stream()
                .filter(card -> !card.isHidden())
                .filter(card -> TrickValidator.isLegalMove(currentTrick, card, trumpSuite, player))
                .findFirst()
                .orElseThrow(() -> new IllegalStateException("No legal card available for timeout"));
    }

    private void scheduleCardThrow(BeloteGame game, Duration delay) {
        var round = game.getCurrentRound();
        if (round == null || round.getRoundStatus() != RoundStatus.PLAYING) {
            return;
        }

        // Cancel the previous turn's timeout so only the current turn's card-throw timer is live.
        // Without this, a turn played before its 30s deadline leaves a stale task whose remaining
        // time would be reported on reconnect instead of the current turn's.
        scheduledTaskRegistry.removeGameTasksOfType(game.getId(), ScheduledTaskType.CARD_THROW_TIMEOUT_TASK);

        scheduledTaskRegistry.registerTask(
                new ScheduledGameTask(
                        ScheduledTaskType.CARD_THROW_TIMEOUT_TASK,
                        delay,
                        game.getId(),
                        Map.of(
                                "roundNumber", round.getRoundNumber(),
                                "trickNumber", round.getCurrentTrickNumber(),
                                "turnIndex", round.getCurrentTurnIndex()
                        )
                )
        );
    }

    private void scheduleNextTrickStart(BeloteGame game, int completedTrickNumber, Integer winningTurnIndex) {
        if (winningTurnIndex == null) {
            throw new IllegalStateException("Cannot schedule next trick without a winning turn index");
        }

        var round = game.getCurrentRound();
        if (round == null || round.getRoundStatus() != RoundStatus.PLAYING) {
            return;
        }

        scheduledTaskRegistry.registerTask(
                new ScheduledGameTask(
                        ScheduledTaskType.NEXT_TRICK_START_TASK,
                        NEXT_TRICK_DELAY,
                        game.getId(),
                        Map.of(
                                "roundNumber", round.getRoundNumber(),
                                "completedTrickNumber", completedTrickNumber,
                                "winningTurnIndex", winningTurnIndex
                        )
                )
        );
    }

}
