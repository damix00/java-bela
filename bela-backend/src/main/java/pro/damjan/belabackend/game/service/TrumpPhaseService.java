package pro.damjan.belabackend.game.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import pro.damjan.belabackend.game.events.BeloteGameEventPublisher;
import pro.damjan.belabackend.game.model.BeloteGame;
import pro.damjan.belabackend.game.model.card.Card;
import pro.damjan.belabackend.game.model.card.Suite;
import pro.damjan.belabackend.game.model.player.GamePlayer;
import pro.damjan.belabackend.game.model.round.RoundStatus;
import pro.damjan.belabackend.game.scheduling.registry.ScheduledTaskRegistry;
import pro.damjan.belabackend.game.scheduling.tasks.ScheduledGameTask;
import pro.damjan.belabackend.game.scheduling.tasks.ScheduledTaskType;

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
    private static final Duration TRUMP_CHOICE_TIMEOUT = Duration.ofSeconds(10);
    private static final Duration CARD_THROW_TIMEOUT = Duration.ofSeconds(30);

    private final GameAccessService gameAccessService;
    private final BeloteGameEventPublisher gamePublisher;
    private final ScheduledTaskRegistry scheduledTaskRegistry;
    private final CardPlayService cardPlayService;

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

        int skippedTurnIndex = round.getCurrentTurnIndex();
        round.passTrumpChoice();

        gameAccessService.save(game);
        gamePublisher.trumpChoiceSkipped(game, skippedTurnIndex, TRUMP_CHOICE_TIMEOUT.toSeconds());
        chooseBotTrumpOrSchedule(game);
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

    public void chooseTrump(String userId, Suite suite) {
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

        int skippedTurnIndex = round.getCurrentTurnIndex();
        round.passTrumpChoice();

        gameAccessService.save(game);
        gamePublisher.trumpChoiceSkipped(game, skippedTurnIndex, TRUMP_CHOICE_TIMEOUT.toSeconds());
        chooseBotTrumpOrSchedule(game);
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

        game.getCurrentRound().chooseTrump(suite);

        for (GamePlayer player : game.getPlayers()) {
            player.getHand().forEach(card -> card.setHidden(false));
            player.updateTrumpSuite(suite);
        }

        game.getCurrentRound().setRoundStatus(RoundStatus.PLAYING);
        game.getCurrentRound().startNewTrick();

        gameAccessService.save(game);
        gamePublisher.trumpChosen(game, chosenByTurnIndex, suite, RoundStatus.PLAYING, revealedCardsByUserId);
        if (!isCurrentPlayerBot(game)) {
            gamePublisher.cardTurnStarted(game, CARD_THROW_TIMEOUT.toSeconds());
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

        int skippedTurnIndex = round.getCurrentTurnIndex();
        round.passTrumpChoice();

        gameAccessService.save(game);
        gamePublisher.trumpChoiceSkipped(game, skippedTurnIndex, TRUMP_CHOICE_TIMEOUT.toSeconds());
        chooseBotTrumpOrSchedule(game);
    }

    private boolean isCurrentPlayerBot(BeloteGame game) {
        return game.getPlayer(game.getCurrentRound().getCurrentTurnIndex()).isBot();
    }
}
