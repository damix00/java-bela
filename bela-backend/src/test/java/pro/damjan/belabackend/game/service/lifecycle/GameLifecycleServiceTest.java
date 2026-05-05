package pro.damjan.belabackend.game.service.lifecycle;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.data.redis.core.SetOperations;
import org.springframework.data.redis.core.StringRedisTemplate;
import pro.damjan.belabackend.game.events.BeloteGameEventPublisher;
import pro.damjan.belabackend.game.model.BeloteGame;
import pro.damjan.belabackend.game.model.GameStatus;
import pro.damjan.belabackend.game.model.card.Card;
import pro.damjan.belabackend.game.model.player.GamePlayer;
import pro.damjan.belabackend.game.model.player.Team;
import pro.damjan.belabackend.game.model.player.TeamPair;
import pro.damjan.belabackend.game.model.round.RoundStatus;
import pro.damjan.belabackend.game.scheduling.registry.ScheduledTaskRegistry;
import pro.damjan.belabackend.game.scheduling.tasks.ScheduledGameTask;
import pro.damjan.belabackend.game.scheduling.tasks.ScheduledTaskType;
import pro.damjan.belabackend.game.service.access.GameAccessService;
import pro.damjan.belabackend.game.service.play.TrumpPhaseService;
import pro.damjan.belabackend.lobby.model.LobbyPlayer;
import pro.damjan.belabackend.lobby.model.LobbyPlayerStatus;
import pro.damjan.belabackend.user.presence.UserPresenceService;

import java.util.List;
import java.util.concurrent.TimeUnit;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class GameLifecycleServiceTest {

    private GameAccessService gameAccessService;
    private UserPresenceService userPresenceService;
    private BeloteGameEventPublisher gamePublisher;
    private ScheduledTaskRegistry scheduledTaskRegistry;
    private StringRedisTemplate redisTemplate;
    private SetOperations<String, String> setOperations;
    private TrumpPhaseService trumpPhaseService;
    private GameLifecycleService gameLifecycleService;

    @BeforeEach
    void setUp() {
        gameAccessService = mock(GameAccessService.class);
        userPresenceService = mock(UserPresenceService.class);
        gamePublisher = mock(BeloteGameEventPublisher.class);
        scheduledTaskRegistry = mock(ScheduledTaskRegistry.class);
        redisTemplate = mock(StringRedisTemplate.class);
        setOperations = mock(SetOperations.class);
        trumpPhaseService = mock(TrumpPhaseService.class);
        when(redisTemplate.opsForSet()).thenReturn(setOperations);
        gameLifecycleService = new GameLifecycleService(
                gameAccessService,
                userPresenceService,
                gamePublisher,
                scheduledTaskRegistry,
                redisTemplate,
                trumpPhaseService
        );
    }

    @Test
    void createGameMapsLobbyPlayersToTeamsAndCountsBotsAsLoaded() {
        when(gameAccessService.save(any(BeloteGame.class))).thenAnswer(invocation -> invocation.getArgument(0));

        BeloteGame game = gameLifecycleService.createGame(List.of(
                lobbyPlayer("p0", 0, false),
                lobbyPlayer("bot-1", 1, true),
                lobbyPlayer("p2", 2, false),
                lobbyPlayer("bot-3", 3, true)
        ));

        assertThat(game.getStatus()).isEqualTo(GameStatus.WAITING);
        assertThat(game.getPlayer(0).getUserId()).isEqualTo("p0");
        assertThat(game.getPlayer(1).getUserId()).isEqualTo("bot-1");
        assertThat(game.getPlayer(2).getUserId()).isEqualTo("p2");
        assertThat(game.getPlayer(3).getUserId()).isEqualTo("bot-3");
        verify(setOperations).add("game:loaded:" + game.getId(), "bot-1", "bot-3");
        verify(redisTemplate).expire("game:loaded:" + game.getId(), 1, TimeUnit.HOURS);
    }

    @Test
    void fourthLoadedPlayerStartsGameAndSchedulesRoundStart() {
        BeloteGame game = game();
        when(gameAccessService.requireUserGame("p3")).thenReturn(game);
        when(setOperations.size("game:loaded:game-1")).thenReturn(4L);

        gameLifecycleService.onLoaded("p3");

        assertThat(game.getStatus()).isEqualTo(GameStatus.IN_PROGRESS);
        verify(gamePublisher).statusChanged(game);
        verify(scheduledTaskRegistry).registerTask(org.mockito.ArgumentMatchers.argThat(task ->
                task.getType() == ScheduledTaskType.ROUND_START_TASK
                        && task.getGameId().equals("game-1")
                        && task.getRequiredIntParameter("roundNumber") == 0
        ));
        verify(gameAccessService).save(game);
        verify(setOperations).add("game:loaded:game-1", "p3");
        verify(redisTemplate).expire("game:loaded:game-1", 1, TimeUnit.HOURS);
    }

    @Test
    void duplicateLoadedEventDoesNotStartGameEarly() {
        BeloteGame game = game();
        when(gameAccessService.requireUserGame("p2")).thenReturn(game);
        when(setOperations.size("game:loaded:game-1")).thenReturn(3L);

        gameLifecycleService.onLoaded("p2");

        assertThat(game.getStatus()).isEqualTo(GameStatus.WAITING);
        verify(setOperations).add("game:loaded:game-1", "p2");
        verify(gamePublisher, never()).statusChanged(game);
        verify(scheduledTaskRegistry, never()).registerTask(any());
        verify(gameAccessService).save(game);
    }

    @Test
    void startRoundDealsEightCardsHidesLastTwoAndStartsTrumpChoosing() {
        BeloteGame game = game();
        when(gameAccessService.requireGameById("game-1")).thenReturn(game);

        gameLifecycleService.startRound("game-1", 0);

        assertThat(game.getCurrentRoundNumber()).isEqualTo(0);
        assertThat(game.getCurrentRound().getRoundStatus()).isEqualTo(RoundStatus.CHOOSING_TRUMP);
        for (GamePlayer player : game.getPlayers()) {
            assertThat(player.getHand()).hasSize(8);
            assertThat(player.getHand().stream().filter(Card::isHidden)).hasSize(2);
        }
        verify(gameAccessService).save(game);
        verify(gamePublisher).roundStarted(game);
        verify(gamePublisher).trumpChoosingStarted(game, 10L);
        verify(trumpPhaseService).chooseBotTrumpOrSchedule(game);
    }

    @Test
    void roundTrumpChooserRotatesInSeatOrder() {
        BeloteGame game = game();

        assertThat(game.createNewRound().getCurrentTurnIndex()).isEqualTo(0);
        assertThat(game.createNewRound().getCurrentTurnIndex()).isEqualTo(1);
        assertThat(game.createNewRound().getCurrentTurnIndex()).isEqualTo(2);
        assertThat(game.createNewRound().getCurrentTurnIndex()).isEqualTo(3);
        assertThat(game.createNewRound().getCurrentTurnIndex()).isEqualTo(0);
    }

    @Test
    void dropGameRemovesTasksClearsHumanPresenceAndDeletesGame() {
        BeloteGame game = game();
        game.getPlayer(1).receiveCards(List.of());
        when(gameAccessService.findGameById("game-1")).thenReturn(game);

        gameLifecycleService.dropGame("game-1");

        verify(scheduledTaskRegistry).removeTasksForGame("game-1");
        verify(userPresenceService).cancelUserGame("p0");
        verify(userPresenceService).cancelUserGame("p1");
        verify(userPresenceService).cancelUserGame("p2");
        verify(userPresenceService).cancelUserGame("p3");
        verify(gameAccessService).delete(game);
    }

    private BeloteGame game() {
        List<GamePlayer> players = List.of(
                new GamePlayer("p0", 0),
                new GamePlayer("p1", 1),
                new GamePlayer("p2", 2),
                new GamePlayer("p3", 3)
        );
        TeamPair teams = Team.pairFrom(players);
        return BeloteGame.builder()
                .id("game-1")
                .team1(teams.teamA())
                .team2(teams.teamB())
                .maxPoints(1001)
                .status(GameStatus.WAITING)
                .build();
    }

    private LobbyPlayer lobbyPlayer(String userId, int seat, boolean bot) {
        LobbyPlayer player = new LobbyPlayer(userId, false, LobbyPlayerStatus.READY, seat);
        player.setBot(bot);
        return player;
    }
}
