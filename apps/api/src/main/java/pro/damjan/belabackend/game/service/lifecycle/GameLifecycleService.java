package pro.damjan.belabackend.game.service.lifecycle;

import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import pro.damjan.belabackend.game.events.BeloteGameEventPublisher;
import pro.damjan.belabackend.game.model.BeloteGame;
import pro.damjan.belabackend.game.model.GameStatus;
import pro.damjan.belabackend.game.model.card.Card;
import pro.damjan.belabackend.game.model.config.GameConfiguration;
import pro.damjan.belabackend.game.model.card.Deck;
import pro.damjan.belabackend.game.model.player.GamePlayer;
import pro.damjan.belabackend.game.model.player.Team;
import pro.damjan.belabackend.game.model.player.TeamPair;
import pro.damjan.belabackend.game.scheduling.registry.ScheduledTaskRegistry;
import pro.damjan.belabackend.game.service.access.GameAccessService;
import pro.damjan.belabackend.game.service.play.GameFlowService;
import pro.damjan.belabackend.game.service.play.TrumpPhaseService;
import pro.damjan.belabackend.lobby.model.Lobby;
import pro.damjan.belabackend.lobby.model.LobbyPlayer;
import pro.damjan.belabackend.user.presence.UserPresenceService;

import java.util.List;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
public class GameLifecycleService {

    private final GameAccessService gameAccessService;
    private final UserPresenceService userPresenceService;
    private final BeloteGameEventPublisher gamePublisher;
    private final ScheduledTaskRegistry scheduledTaskRegistry;
    private final StringRedisTemplate redisTemplate;
    private final TrumpPhaseService trumpPhaseService;
    private final GameFlowService gameFlowService;

    public BeloteGame createGame(Lobby lobby) {
        List<LobbyPlayer> lobbyPlayers = lobby.getPlayersAsList();

        List<GamePlayer> players = lobbyPlayers
                .stream()
                .map(p -> new GamePlayer(p.getUserId(), p.getSeat(), p.isBot(), p.getUsername(), p.getAvatarUrl()))
                .toList();

        return createGame(players, lobby.getGameConfiguration());
    }

    /**
     * Creates a game from an explicit seating rather than from one lobby's.
     *
     * A matched table is drawn from two to four lobbies that all stay as they are, so there is no
     * single lobby whose seats describe it. The players arrive already seated — index in the list
     * is the seat — and everything downstream is the same either way.
     *
     * @param players exactly four, ordered by seat
     */
    public BeloteGame createGame(List<GamePlayer> players, GameConfiguration config) {
        TeamPair teams = Team.pairFrom(players);

        BeloteGame game = BeloteGame.builder()
                .id(UUID.randomUUID().toString())
                .team1(teams.teamA())
                .team2(teams.teamB())
                .config(config)
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

            gameFlowService.scheduleNextRoundStart(game, game.getCurrentRoundNumber() + 1);
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

    /**
     * Records that a player has left a finished game, and tears the game down once they all have.
     *
     * The "have they all left?" decision rides on a Redis set rather than the in-process game lock,
     * which does not span instances — SADD/SCARD means exactly one caller sees the count reach the
     * human count, whichever box it lands on. Bots never leave, so only humans are counted.
     */
    public void leaveFinishedGame(String userId, String gameId) {
        BeloteGame game = gameAccessService.findGameById(gameId);

        // Already dropped by the last player out; the caller still announces the leave so the
        // player's lobby can take them back.
        if (game == null) {
            return;
        }

        if (game.getStatus() != GameStatus.FINISHED) {
            throw new IllegalStateException(
                    "Player " + userId + " tried to leave game " + gameId + " before it finished"
            );
        }

        String key = leftKey(gameId);
        redisTemplate.opsForSet().add(key, userId);
        Long leftCount = redisTemplate.opsForSet().size(key);
        redisTemplate.expire(key, 1, TimeUnit.HOURS);

        long humanCount = game.getPlayers().stream().filter(player -> !player.isBot()).count();

        if (leftCount != null && leftCount >= humanCount) {
            dropGame(gameId);
        }
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

        redisTemplate.delete(List.of(loadedKey(gameId), leftKey(gameId)));
        gameAccessService.delete(game);
    }

    private String loadedKey(String gameId) {
        return "game:loaded:" + gameId;
    }

    private String leftKey(String gameId) {
        return "game:left:" + gameId;
    }
}
