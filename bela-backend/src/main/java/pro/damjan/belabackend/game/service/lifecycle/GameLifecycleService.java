package pro.damjan.belabackend.game.service.lifecycle;

import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import pro.damjan.belabackend.game.events.BeloteGameEventPublisher;
import pro.damjan.belabackend.game.model.BeloteGame;
import pro.damjan.belabackend.game.model.GameStatus;
import pro.damjan.belabackend.game.model.card.Card;
import pro.damjan.belabackend.game.model.card.Deck;
import pro.damjan.belabackend.game.model.player.GamePlayer;
import pro.damjan.belabackend.game.model.player.Team;
import pro.damjan.belabackend.game.model.player.TeamPair;
import pro.damjan.belabackend.game.scheduling.registry.ScheduledTaskRegistry;
import pro.damjan.belabackend.game.scheduling.tasks.ScheduledGameTask;
import pro.damjan.belabackend.game.scheduling.tasks.ScheduledTaskType;
import pro.damjan.belabackend.game.service.access.GameAccessService;
import pro.damjan.belabackend.game.service.play.TrumpPhaseService;
import pro.damjan.belabackend.lobby.model.LobbyPlayer;
import pro.damjan.belabackend.user.presence.UserPresenceService;

import java.time.Duration;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
public class GameLifecycleService {

    private static final Duration ROUND_START_DELAY = Duration.ofSeconds(5);

    private final GameAccessService gameAccessService;
    private final UserPresenceService userPresenceService;
    private final BeloteGameEventPublisher gamePublisher;
    private final ScheduledTaskRegistry scheduledTaskRegistry;
    private final StringRedisTemplate redisTemplate;
    private final TrumpPhaseService trumpPhaseService;

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

        BeloteGame savedGame = gameAccessService.save(game);

        long botCount = players.stream().filter(GamePlayer::isBot).count();
        if (botCount > 0) {
            String key = loadedKey(savedGame.getId());
            String[] botUserIds = players
                    .stream()
                    .filter(GamePlayer::isBot)
                    .map(GamePlayer::getUserId)
                    .toArray(String[]::new);
            redisTemplate.opsForSet().add(key, botUserIds);
            redisTemplate.expire(key, 1, TimeUnit.HOURS);
        }

        return savedGame;
    }

    public void onLoaded(String userId) {
        BeloteGame game = gameAccessService.requireUserGame(userId);

        if (game.getStatus() != GameStatus.WAITING) {
            return;
        }

        String key = loadedKey(game.getId());
        redisTemplate.opsForSet().add(key, userId);
        Long loadedCount = redisTemplate.opsForSet().size(key);
        redisTemplate.expire(key, 1, TimeUnit.HOURS);

        if (loadedCount != null && loadedCount == 4) {
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

        gameAccessService.save(game);
    }

    public void startRound(String gameId) {
        startRound(gameId, null);
    }

    public void startRound(String gameId, Integer expectedRoundNumber) {
        BeloteGame game = gameAccessService.requireGameById(gameId);

        if (expectedRoundNumber != null && game.getCurrentRoundNumber() >= expectedRoundNumber) {
            return;
        }

        game.createNewRound();

        Deck deck = new Deck();
        deck.shuffle();

        for (GamePlayer player : game.getPlayers()) {
            List<Card> hand = deck.deal(8);
            hand.get(6).setHidden(true);
            hand.get(7).setHidden(true);

            player.receiveCards(hand);
        }

        gameAccessService.save(game);
        gamePublisher.roundStarted(game);
        gamePublisher.trumpChoosingStarted(game, 10L);
        trumpPhaseService.chooseBotTrumpOrSchedule(game);
    }

    public void dropGame(String gameId) {
        BeloteGame game = gameAccessService.findGameById(gameId);

        if (game == null) {
            return;
        }

        scheduledTaskRegistry.removeTasksForGame(gameId);

        for (GamePlayer player : game.getPlayers()) {
            if (player.isBot()) continue;

            userPresenceService.cancelUserGame(player.getUserId());
        }

        gameAccessService.delete(game);
    }

    private String loadedKey(String gameId) {
        return "game:loaded:" + gameId;
    }
}
