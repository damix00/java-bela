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
import pro.damjan.belabackend.game.scheduling.tasks.RoundStartTask;
import pro.damjan.belabackend.lobby.model.LobbyPlayer;
import pro.damjan.belabackend.user.presence.UserPresence;
import pro.damjan.belabackend.user.presence.UserPresenceService;

import java.util.List;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
public class BeloteGameService {

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
                .map(p -> new GamePlayer(p.getUserId(), p.getSeat()))
                .toList();

        TeamPair teams = Team.pairFrom(players);

        BeloteGame game = BeloteGame.builder()
                .id(UUID.randomUUID().toString())
                .team1(teams.teamA())
                .team2(teams.teamB())
                .maxPoints(1001)
                .status(GameStatus.WAITING)
                .build();

        return beloteGameRepository.save(game);
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

        // Increment the loaded count for this game in Redis
        String key = "game:loaded:" + game.getId();
        Long loadedCount = redisTemplate.opsForValue().increment(key);
        redisTemplate.expire(key, 1, TimeUnit.HOURS); // cleanup

        if (loadedCount == 4) {
            game.startGame();
            gamePublisher.gameStatusUpdated(game);

            scheduledTaskRegistry.registerTask(
                    new RoundStartTask(game.getId())
            );
        }

        beloteGameRepository.save(game);
    }

    public void startRound(String gameId) {

    }
}
