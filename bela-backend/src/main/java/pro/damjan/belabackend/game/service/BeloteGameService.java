package pro.damjan.belabackend.game.service;

import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import pro.damjan.belabackend.game.events.BeloteGameEventPublisher;
import pro.damjan.belabackend.game.exception.GameNotFoundException;
import pro.damjan.belabackend.game.model.BeloteGame;
import pro.damjan.belabackend.game.model.GameStatus;
import pro.damjan.belabackend.game.model.player.GamePlayer;
import pro.damjan.belabackend.game.model.player.Team;
import pro.damjan.belabackend.game.model.player.TeamPair;
import pro.damjan.belabackend.game.repository.BeloteGameRepository;
import pro.damjan.belabackend.game.scheduling.registry.ScheduledTaskRegistry;
import pro.damjan.belabackend.game.scheduling.tasks.ScheduledGameTask;
import pro.damjan.belabackend.game.scheduling.tasks.ScheduledTaskType;
import pro.damjan.belabackend.game.model.card.Card;
import pro.damjan.belabackend.game.model.card.Deck;
import pro.damjan.belabackend.game.model.card.Suite;
import pro.damjan.belabackend.lobby.model.LobbyPlayer;
import pro.damjan.belabackend.user.presence.UserPresence;
import pro.damjan.belabackend.user.presence.UserPresenceService;

import java.time.Duration;
import java.util.Comparator;
import java.util.EnumMap;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
public class BeloteGameService {

    private static final Duration ROUND_START_DELAY = Duration.ofSeconds(5);
    private static final Duration TRUMP_CHOICE_TIMEOUT = Duration.ofSeconds(10);

    private final BeloteGameRepository beloteGameRepository;
    private final UserPresenceService userPresenceService;
    private final BeloteGameEventPublisher gamePublisher;
    private final ScheduledTaskRegistry scheduledTaskRegistry;
    private final StringRedisTemplate redisTemplate;

    private String getUserGameId(String userId) {
        UserPresence userPresence = userPresenceService.getUserPresence(userId);

        if (userPresence == null) {
            return null;
        }

        return userPresence.getGameId();
    }

    private BeloteGame getUserGame(String userId) {
        String gameId = getUserGameId(userId);

        if (gameId == null) {
            return null;
        }

        return findGameById(gameId);
    }

    public BeloteGame createGame(List<LobbyPlayer> lobbyPlayers) {
        List<GamePlayer> players = lobbyPlayers
                .stream()
                .map(p -> new GamePlayer(p.getUserId(), p.getSeat(), p.isBot()))
                .toList();

        TeamPair teams = Team.pairFrom(players);

        BeloteGame game = BeloteGame.builder()
                .id(UUID.randomUUID().toString())
                .team1(teams.teamA())
                .team2(teams.teamB())
                .maxPoints(1001)
                .status(GameStatus.WAITING)
                .build();

        BeloteGame savedGame = beloteGameRepository.save(game);

        // Auto-count bots as loaded
        long botCount = players.stream().filter(GamePlayer::isBot).count();
        if (botCount > 0) {
            String key = "game:loaded:" + savedGame.getId();
            redisTemplate.opsForValue().set(key, String.valueOf(botCount));
            redisTemplate.expire(key, 1, TimeUnit.HOURS);
        }

        return savedGame;
    }

    public BeloteGame findGameById(String gameId) {
        return beloteGameRepository.findById(gameId).orElse(null);
    }

    // This method is called when a player finishes loading the game and is ready to start
    public void onLoaded(String userId) {
        BeloteGame game = getUserGame(userId);

        if (game == null) {
            throw new GameNotFoundException();
        }

        if (game.getStatus() != GameStatus.WAITING) {
            return; // Game already started, ignore
        }

        // Increment the loaded count for this game in Redis
        String key = "game:loaded:" + game.getId();
        Long loadedCount = redisTemplate.opsForValue().increment(key);
        redisTemplate.expire(key, 1, TimeUnit.HOURS); // cleanup

        if (loadedCount == 4) {
            game.startGame();
            gamePublisher.statusChanged(game);

            scheduledTaskRegistry.registerTask(
                    new ScheduledGameTask(
                            ScheduledTaskType.ROUND_START_TASK,
                            ROUND_START_DELAY,
                            game.getId(),
                            Map.of("roundNumber", game.getCurrentRoundNumber() + 1)
                    )
            );
        }

        beloteGameRepository.save(game);
    }

    public void startRound(String gameId) {
        startRound(gameId, null);
    }

    public void startRound(String gameId, Integer expectedRoundNumber) {
        BeloteGame game = findGameById(gameId);

        if (game == null) {
            throw new GameNotFoundException();
        }

        if (expectedRoundNumber != null && game.getCurrentRoundNumber() >= expectedRoundNumber) {
            return;
        }

        game.createNewRound();

        Deck deck = new Deck();
        deck.shuffle();

        for (GamePlayer player : game.getPlayers()) {
            List<Card> hand = deck.deal(8);
            // Last 2 cards are hidden until trump is chosen
            hand.get(6).setHidden(true);
            hand.get(7).setHidden(true);

            player.receiveCards(hand);
        }

        beloteGameRepository.save(game);
        gamePublisher.roundStarted(game);
        scheduleTrumpChoiceTimeout(game);
        gamePublisher.trumpChoosingStarted(game, TRUMP_CHOICE_TIMEOUT.toSeconds());
    }

    public void handleChoosingTrumpTimeout(String gameId, int roundNumber, int turnIndex) {
        BeloteGame game = findGameById(gameId);

        if (game == null) {
            throw new GameNotFoundException();
        }

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
        } else {
            int skippedTurnIndex = round.getCurrentTurnIndex();
            round.passTrumpChoice();

            beloteGameRepository.save(game);
            scheduleTrumpChoiceTimeout(game);
            gamePublisher.trumpChoiceSkipped(game, skippedTurnIndex, TRUMP_CHOICE_TIMEOUT.toSeconds());
        }
    }

    public void chooseTrump(String userId, Suite suite) {
        BeloteGame game = getUserGame(userId);

        if (game == null) {
            throw new GameNotFoundException();
        }

        var round = game.getCurrentRound();
        GamePlayer player = getCurrentTrumpChooser(game);

        if (!player.getUserId().equals(userId)) {
            throw new IllegalStateException("It is not this player's turn to choose trump");
        }

        chooseTrump(game, suite, round.getCurrentTurnIndex());
    }

    public void passTrump(String userId) {
        BeloteGame game = getUserGame(userId);

        if (game == null) {
            throw new GameNotFoundException();
        }

        var round = game.getCurrentRound();
        GamePlayer player = getCurrentTrumpChooser(game);

        if (!player.getUserId().equals(userId)) {
            throw new IllegalStateException("It is not this player's turn to choose trump");
        }

        int skippedTurnIndex = round.getCurrentTurnIndex();
        round.passTrumpChoice();

        beloteGameRepository.save(game);
        scheduleTrumpChoiceTimeout(game);
        gamePublisher.trumpChoiceSkipped(game, skippedTurnIndex, TRUMP_CHOICE_TIMEOUT.toSeconds());
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
        var roundStatus = game.getCurrentRound().getRoundStatus();

        for (GamePlayer player : game.getPlayers()) {
            player.getHand().forEach(card -> card.setHidden(false));
            player.updateTrumpSuite(suite);
        }

        beloteGameRepository.save(game);
        gamePublisher.trumpChosen(game, chosenByTurnIndex, suite, roundStatus, revealedCardsByUserId);
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

    public void dropGame(String gameId) {
        BeloteGame game = findGameById(gameId);

        if (game == null) {
            return; // Game already dropped, ignore
        }

        scheduledTaskRegistry.removeTasksForGame(gameId);

        for (GamePlayer player : game.getPlayers()) {
            if (player.isBot()) continue;

            userPresenceService.cancelUserGame(player.getUserId());
        }

        beloteGameRepository.delete(game);
    }
}
