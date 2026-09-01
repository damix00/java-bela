package pro.damjan.belabackend.game.service.play;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import pro.damjan.belabackend.game.events.BeloteGameEventPublisher;
import pro.damjan.belabackend.game.model.BeloteGame;
import pro.damjan.belabackend.game.model.card.Card;
import pro.damjan.belabackend.game.model.card.Suite;
import pro.damjan.belabackend.game.model.player.GamePlayer;
import pro.damjan.belabackend.game.model.round.BeloteRound;
import pro.damjan.belabackend.game.model.round.RoundPlayer;
import pro.damjan.belabackend.game.model.round.RoundStatus;
import pro.damjan.belabackend.game.scheduling.registry.ScheduledTaskRegistry;
import pro.damjan.belabackend.game.scheduling.tasks.ScheduledGameTask;
import pro.damjan.belabackend.game.scheduling.tasks.ScheduledTaskType;
import pro.damjan.belabackend.game.service.access.GameAccessService;

import java.time.Duration;
import java.util.Comparator;
import java.util.EnumMap;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class TrumpPhaseService {

    private static final Duration BOT_TRUMP_CHOICE_DELAY = Duration.ofSeconds(1);
    // Calling trump is the round's one real decision — six cards read against a
    // contract you would owe. Ten seconds was a glance; thirty is time to take
    // it. This is both the turn's own clock and the `timeoutSeconds` the client
    // draws its timer from, so the bar follows on its own.
    public static final Duration TRUMP_CHOICE_TIMEOUT = Duration.ofSeconds(30);
    // Two windows, in the order a table plays them: first everyone is asked, privately, whether
    // they declare; then what was declared is on the table for everyone to read.
    private static final Duration DECLARATION_ASK_TIMEOUT = Duration.ofSeconds(10);
    private static final Duration DECLARATION_REVEAL_DELAY = Duration.ofSeconds(5);

    private final GameAccessService gameAccessService;
    private final BeloteGameEventPublisher gamePublisher;
    private final ScheduledTaskRegistry scheduledTaskRegistry;
    private final CardPlayService cardPlayService;
    private final GameFlowService gameFlowService;

    public void handleChoosingTrumpTimeout(String gameId, int roundNumber, int turnIndex) {
        BeloteGame game = gameAccessService.requireGameById(gameId);

        var round = game.getCurrentRound();
        if (round == null
                || !round.isChoosingTrump()
                || round.getRoundNumber() != roundNumber
                || round.getCurrentTurnIndex() != turnIndex) {
            return;
        }

        if (round.isLastTrumpChooser()) {
            GamePlayer player = game.getPlayer(turnIndex);
            chooseTrump(game, chooseBestSuite(player), turnIndex);
            return;
        }

        passTrumpChoice(game, round.getCurrentTurnIndex());
    }

    public void handleBotTrumpChoice(String gameId, int roundNumber, int turnIndex) {
        BeloteGame game = gameAccessService.requireGameById(gameId);

        var round = game.getCurrentRound();
        if (round == null
                || !round.isChoosingTrump()
                || round.getRoundNumber() != roundNumber
                || round.getCurrentTurnIndex() != turnIndex
                || !game.getPlayer(turnIndex).isBot()) {
            return;
        }

        chooseBotTrump(game);
    }

    /**
     * The ask window ran out. Silence declares — the protocol has only ever had an opt-out — so the
     * seats that never answered are simply marked answered, and the reveal follows.
     */
    public void handleDeclarationAskTimeout(String gameId, int roundNumber) {
        BeloteGame game = gameAccessService.requireGameById(gameId);

        var round = game.getCurrentRound();
        if (round == null
                || round.getRoundStatus() != RoundStatus.DECLARING
                || round.getRoundNumber() != roundNumber) {
            return;
        }

        for (RoundPlayer player : round.getRoundPlayers()) {
            round.markDeclarationsAnswered(player.getPlayerIndex());
        }

        advanceToReveal(game);
    }

    public void handleDeclarationsComplete(String gameId, int roundNumber) {
        BeloteGame game = gameAccessService.requireGameById(gameId);

        var round = game.getCurrentRound();
        if (round == null
                || round.getRoundStatus() != RoundStatus.DECLARATIONS
                || round.getRoundNumber() != roundNumber) {
            return;
        }

        startCardPlay(game);
        // Same reason as the phase's other exit: with a bot leading, nothing else would tell the
        // table the reveal is over.
        gamePublisher.broadcastSnapshot(game);
        publishFirstCardTurnOrSchedule(game);
    }

    public void chooseTrump(String userId, Suite suite) {
        if (suite == null) {
            throw new IllegalArgumentException("Trump suite is required");
        }

        BeloteGame game = gameAccessService.requireUserGame(userId);
        var round = game.getCurrentRound();
        GamePlayer player = getCurrentTrumpChooser(game);

        if (!player.getUserId().equals(userId)) {
            throw new IllegalStateException("It is not this player's turn to choose trump");
        }

        chooseTrump(game, suite, round.getCurrentTurnIndex());
    }

    public void passTrump(String userId) {
        BeloteGame game = gameAccessService.requireUserGame(userId);
        var round = game.getCurrentRound();
        GamePlayer player = getCurrentTrumpChooser(game);

        if (!player.getUserId().equals(userId)) {
            throw new IllegalStateException("It is not this player's turn to choose trump");
        }

        passTrumpChoice(game, round.getCurrentTurnIndex());
    }

    /**
     * A player's answer to the declarations question. Every seat is asked, whether or not it holds
     * anything — a prompt that only appeared for players with zvanja would announce that somebody
     * has them. Once all four have answered there is nothing left to wait for, so the window closes
     * early rather than burning the rest of its clock.
     */
    public void answerDeclarations(String userId, boolean declare) {
        BeloteGame game = gameAccessService.requireUserGame(userId);
        BeloteRound round = game.getCurrentRound();

        if (round == null || round.getRoundStatus() != RoundStatus.DECLARING) {
            throw new IllegalStateException("Declarations cannot be answered outside the declarations ask phase");
        }

        GamePlayer player = game.getPlayers().stream()
                .filter(p -> p.getUserId().equals(userId))
                .findFirst()
                .orElseThrow(() -> new IllegalStateException("Player is not part of this game"));

        round.answerDeclarations(player.getSeatIndex(), declare);

        gameAccessService.save(game);
        // Says who the table is still waiting on. The snapshot withholds the answers themselves
        // while the round is asking, so this reveals nothing about anyone's hand.
        gamePublisher.broadcastSnapshot(game);

        advanceToRevealIfAllAnswered(game);
    }

    private GamePlayer getCurrentTrumpChooser(BeloteGame game) {
        var round = game.getCurrentRound();

        if (round == null || !round.isChoosingTrump()) {
            throw new IllegalStateException("Round is not choosing trump");
        }

        return game.getPlayer(round.getCurrentTurnIndex());
    }

    private void chooseTrump(BeloteGame game, Suite suite, int chosenByTurnIndex) {
        Map<String, List<Card>> revealedCardsByUserId = new HashMap<>();

        for (GamePlayer player : game.getPlayers()) {
            revealedCardsByUserId.put(
                    player.getUserId(),
                    player.getHand()
                            .stream()
                            .filter(Card::isHidden)
                            .toList()
            );
        }

        BeloteRound round = game.getCurrentRound();

        round.chooseTrump(suite);

        for (GamePlayer player : game.getPlayers()) {
            player.getHand().forEach(card -> card.setHidden(false));
            player.updateTrumpSuite(suite);
        }

        round.seedDeclarations(game.getPlayers());

        if (round.hasBelot()) {
            round.setRoundStatus(RoundStatus.FINISHED);
            game.finishCurrentRoundScoring();

            gameAccessService.save(game);
            gamePublisher.trumpChosen(game, chosenByTurnIndex, suite, RoundStatus.FINISHED, revealedCardsByUserId, 0);
            gameFlowService.endGameOrScheduleNextRound(game, round.getRoundNumber());
            return;
        }

        // Everyone is asked, always: entering the phase only when somebody holds zvanja would make
        // the phase itself the tell.
        round.setRoundStatus(RoundStatus.DECLARING);
        markBotSeatsAnswered(game);

        gameAccessService.save(game);
        gamePublisher.trumpChosen(
                game,
                chosenByTurnIndex,
                suite,
                RoundStatus.DECLARING,
                revealedCardsByUserId,
                DECLARATION_ASK_TIMEOUT.toSeconds()
        );

        if (!advanceToRevealIfAllAnswered(game)) {
            scheduleDeclarationAskTimeout(game);
        }
    }

    /** Bots never answer for themselves, and they always declare. */
    private void markBotSeatsAnswered(BeloteGame game) {
        BeloteRound round = game.getCurrentRound();

        for (GamePlayer player : game.getPlayers()) {
            if (player.isBot()) {
                round.markDeclarationsAnswered(player.getSeatIndex());
            }
        }
    }

    private boolean advanceToRevealIfAllAnswered(BeloteGame game) {
        if (!game.getCurrentRound().allDeclarationsAnswered()) {
            return false;
        }

        advanceToReveal(game);
        return true;
    }

    /**
     * Closes the ask window: either show what was declared for a beat, or — when the round has
     * nothing to show, because nobody held zvanja or everybody declined — go straight to play.
     */
    private void advanceToReveal(BeloteGame game) {
        BeloteRound round = game.getCurrentRound();

        // The window can close early, so its timeout must not fire into the phase that follows.
        scheduledTaskRegistry.removeGameTasksOfType(game.getId(), ScheduledTaskType.DECLARATION_ASK_TIMEOUT_TASK);

        if (round.hasDeclarations()) {
            round.setRoundStatus(RoundStatus.DECLARATIONS);

            gameAccessService.save(game);
            gamePublisher.declarationsRevealed(game, DECLARATION_REVEAL_DELAY.toSeconds());
            scheduleDeclarationsComplete(game);
            return;
        }

        startCardPlay(game);
        // With a bot leading there is no cardTurnStarted to announce the new phase, so the snapshot
        // is what tells the table the ask is over.
        gamePublisher.broadcastSnapshot(game);
        publishFirstCardTurnOrSchedule(game);
    }

    private void startCardPlay(BeloteGame game) {
        BeloteRound round = game.getCurrentRound();

        round.setRoundStatus(RoundStatus.PLAYING);
        round.setCurrentTurnIndex(round.getStartingPlayerIndex());
        round.startNewTrick();

        gameAccessService.save(game);
    }

    private void publishFirstCardTurnOrSchedule(BeloteGame game) {
        if (!isCurrentPlayerBot(game)) {
            gamePublisher.cardTurnStarted(game, CardPlayService.CARD_THROW_TIMEOUT.toSeconds());
        }

        cardPlayService.playBotTurnOrSchedule(game);
    }

    private Suite chooseBestSuite(GamePlayer player) {
        Map<Suite, Integer> suiteCounts = new EnumMap<>(Suite.class);
        for (Suite suite : Suite.values()) {
            suiteCounts.put(suite, 0);
        }

        for (Card card : player.getHand()) {
            if (card.isHidden()) continue;
            suiteCounts.compute(card.getSuite(), (suite, count) -> count == null ? 1 : count + 1);
        }

        return suiteCounts.entrySet()
                .stream()
                .max(Comparator.comparingInt(Map.Entry::getValue))
                .map(Map.Entry::getKey)
                .orElse(Suite.HEARTS);
    }

    private void scheduleTrumpChoiceTimeout(BeloteGame game) {
        var round = game.getCurrentRound();
        if (round == null || !round.isChoosingTrump()) {
            return;
        }

        // Cancel the previous chooser's timeout so only the current turn's trump timer is live.
        scheduledTaskRegistry.removeGameTasksOfType(game.getId(), ScheduledTaskType.CHOOSING_TRUMP_TIMEOUT_TASK);

        scheduledTaskRegistry.registerTask(
                new ScheduledGameTask(
                        ScheduledTaskType.CHOOSING_TRUMP_TIMEOUT_TASK,
                        TRUMP_CHOICE_TIMEOUT,
                        game.getId(),
                        Map.of(
                                "roundNumber", round.getRoundNumber(),
                                "turnIndex", round.getCurrentTurnIndex()
                        )
                )
        );
    }

    private void scheduleBotTrumpChoice(BeloteGame game) {
        var round = game.getCurrentRound();
        if (round == null || !round.isChoosingTrump()) {
            return;
        }

        scheduledTaskRegistry.registerTask(
                new ScheduledGameTask(
                        ScheduledTaskType.BOT_TRUMP_CHOICE_TASK,
                        BOT_TRUMP_CHOICE_DELAY,
                        game.getId(),
                        Map.of(
                                "roundNumber", round.getRoundNumber(),
                                "turnIndex", round.getCurrentTurnIndex()
                        )
                )
        );
    }

    private void scheduleDeclarationAskTimeout(BeloteGame game) {
        var round = game.getCurrentRound();
        if (round == null || round.getRoundStatus() != RoundStatus.DECLARING) {
            return;
        }

        scheduledTaskRegistry.registerTask(
                new ScheduledGameTask(
                        ScheduledTaskType.DECLARATION_ASK_TIMEOUT_TASK,
                        DECLARATION_ASK_TIMEOUT,
                        game.getId(),
                        Map.of("roundNumber", round.getRoundNumber())
                )
        );
    }

    private void scheduleDeclarationsComplete(BeloteGame game) {
        var round = game.getCurrentRound();
        if (round == null || round.getRoundStatus() != RoundStatus.DECLARATIONS) {
            return;
        }

        scheduledTaskRegistry.registerTask(
                new ScheduledGameTask(
                        ScheduledTaskType.DECLARATIONS_COMPLETE_TASK,
                        DECLARATION_REVEAL_DELAY,
                        game.getId(),
                        Map.of("roundNumber", round.getRoundNumber())
                )
        );
    }

    public void chooseBotTrumpOrSchedule(BeloteGame game) {
        var round = game.getCurrentRound();
        if (round == null || !round.isChoosingTrump()) {
            return;
        }

        if (!isCurrentPlayerBot(game)) {
            scheduleTrumpChoiceTimeout(game);
            return;
        }

        scheduleBotTrumpChoice(game);
    }

    private void chooseBotTrump(BeloteGame game) {
        var round = game.getCurrentRound();
        if (round == null || !round.isChoosingTrump() || !isCurrentPlayerBot(game)) {
            return;
        }

        if (round.isLastTrumpChooser()) {
            GamePlayer player = game.getPlayer(round.getCurrentTurnIndex());
            chooseTrump(game, chooseBestSuite(player), round.getCurrentTurnIndex());
            return;
        }

        passTrumpChoice(game, round.getCurrentTurnIndex());
    }

    /**
     * Saying "dalje" is the moment a player is done bidding on six cards, so it is also the moment
     * their own two face-down cards flip — for them alone, and without waiting on whoever ends up
     * calling trump. Bots pass through here too, so the second bidding round reads eight cards for
     * everybody or for nobody.
     */
    private void passTrumpChoice(BeloteGame game, int skippedTurnIndex) {
        GamePlayer passer = game.getPlayer(skippedTurnIndex);

        List<Card> revealed = passer.getHand().stream().filter(Card::isHidden).toList();
        passer.getHand().forEach(card -> card.setHidden(false));

        game.getCurrentRound().passTrumpChoice();

        gameAccessService.save(game);
        gamePublisher.trumpChoiceSkipped(
                game,
                skippedTurnIndex,
                passer.getUserId(),
                revealed,
                TRUMP_CHOICE_TIMEOUT.toSeconds()
        );
        chooseBotTrumpOrSchedule(game);
    }

    private boolean isCurrentPlayerBot(BeloteGame game) {
        return game.getPlayer(game.getCurrentRound().getCurrentTurnIndex()).isBot();
    }
}
