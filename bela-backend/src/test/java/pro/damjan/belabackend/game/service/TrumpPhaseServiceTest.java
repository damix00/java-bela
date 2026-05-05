package pro.damjan.belabackend.game.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import pro.damjan.belabackend.game.events.BeloteGameEventPublisher;
import pro.damjan.belabackend.game.model.BeloteGame;
import pro.damjan.belabackend.game.model.GameStatus;
import pro.damjan.belabackend.game.model.card.Card;
import pro.damjan.belabackend.game.model.card.Rank;
import pro.damjan.belabackend.game.model.card.Suite;
import pro.damjan.belabackend.game.model.player.GamePlayer;
import pro.damjan.belabackend.game.model.player.Team;
import pro.damjan.belabackend.game.model.player.TeamPair;
import pro.damjan.belabackend.game.model.round.RoundStatus;
import pro.damjan.belabackend.game.scheduling.registry.ScheduledTaskRegistry;
import pro.damjan.belabackend.game.scheduling.tasks.ScheduledGameTask;
import pro.damjan.belabackend.game.scheduling.tasks.ScheduledTaskType;

import java.time.Duration;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class TrumpPhaseServiceTest {

    private GameAccessService gameAccessService;
    private BeloteGameEventPublisher gamePublisher;
    private ScheduledTaskRegistry scheduledTaskRegistry;
    private CardPlayService cardPlayService;
    private TrumpPhaseService trumpPhaseService;

    @BeforeEach
    void setUp() {
        gameAccessService = mock(GameAccessService.class);
        gamePublisher = mock(BeloteGameEventPublisher.class);
        scheduledTaskRegistry = mock(ScheduledTaskRegistry.class);
        cardPlayService = mock(CardPlayService.class);
        trumpPhaseService = new TrumpPhaseService(gameAccessService, gamePublisher, scheduledTaskRegistry, cardPlayService);
    }

    @Test
    void chooseTrumpRevealsCardsStartsFirstTrickPublishesTurnAndSchedulesTimeout() {
        BeloteGame game = choosingTrumpGame();
        when(gameAccessService.requireUserGame("p0")).thenReturn(game);

        trumpPhaseService.chooseTrump("p0", Suite.HEARTS);

        var round = game.getCurrentRound();
        assertThat(round.getRoundStatus()).isEqualTo(RoundStatus.PLAYING);
        assertThat(round.getTrumpSuite()).isEqualTo(Suite.HEARTS);
        assertThat(round.getCurrentTrickNumber()).isEqualTo(0);
        assertThat(round.getCurrentTrick()).isNotNull();
        assertThat(game.getPlayers())
                .allSatisfy(player -> assertThat(player.getHand()).allSatisfy(card -> {
                    assertThat(card.isHidden()).isFalse();
                    assertThat(card.isTrump()).isEqualTo(card.getSuite() == Suite.HEARTS);
                }));

        verify(gameAccessService).save(game);
        verify(gamePublisher).trumpChosen(eq(game), eq(0), eq(Suite.HEARTS), eq(RoundStatus.PLAYING), any(Map.class));
        verify(gamePublisher).cardTurnStarted(game, 30L);
        verify(cardPlayService).playBotTurnOrSchedule(game);
    }

    @Test
    void passTrumpAdvancesChooserAndSchedulesNextTrumpTimeout() {
        BeloteGame game = choosingTrumpGame();
        when(gameAccessService.requireUserGame("p0")).thenReturn(game);

        trumpPhaseService.passTrump("p0");

        assertThat(game.getCurrentRound().getCurrentTurnIndex()).isEqualTo(1);
        verify(gameAccessService).save(game);
        verify(gamePublisher).trumpChoiceSkipped(game, 0, 10L);
        verify(scheduledTaskRegistry).registerTask(org.mockito.ArgumentMatchers.argThat(task ->
                task.getType() == ScheduledTaskType.CHOOSING_TRUMP_TIMEOUT_TASK
                        && task.getRequiredIntParameter("roundNumber") == 0
                        && task.getRequiredIntParameter("turnIndex") == 1
        ));
    }

    @Test
    void botTrumpTurnSchedulesOneSecondBotChoice() {
        BeloteGame game = choosingTrumpGame(false, true, false, false);
        game.getCurrentRound().advanceTurn();

        trumpPhaseService.chooseBotTrumpOrSchedule(game);

        assertThat(game.getCurrentRound().getCurrentTurnIndex()).isEqualTo(1);
        verify(scheduledTaskRegistry).registerTask(org.mockito.ArgumentMatchers.argThat(task ->
                task.getType() == ScheduledTaskType.BOT_TRUMP_CHOICE_TASK
                        && task.getDelay().equals(Duration.ofSeconds(1))
                        && task.getRequiredIntParameter("roundNumber") == 0
                        && task.getRequiredIntParameter("turnIndex") == 1
        ));
    }

    @Test
    void delayedBotTrumpTurnPassesThenSchedulesNextHumanTimeout() {
        BeloteGame game = choosingTrumpGame(false, true, false, false);
        game.getCurrentRound().advanceTurn();
        when(gameAccessService.requireGameById("game-1")).thenReturn(game);

        trumpPhaseService.handleBotTrumpChoice("game-1", 0, 1);

        assertThat(game.getCurrentRound().getCurrentTurnIndex()).isEqualTo(2);
        verify(gameAccessService).save(game);
        verify(gamePublisher).trumpChoiceSkipped(game, 1, 10L);
        verify(scheduledTaskRegistry).registerTask(org.mockito.ArgumentMatchers.argThat(task ->
                task.getType() == ScheduledTaskType.CHOOSING_TRUMP_TIMEOUT_TASK
                        && task.getRequiredIntParameter("roundNumber") == 0
                        && task.getRequiredIntParameter("turnIndex") == 2
        ));
    }

    @Test
    void lastBotTrumpChooserSchedulesDelayedChoice() {
        BeloteGame game = choosingTrumpGame(false, false, false, true);
        game.getCurrentRound().advanceTurn();
        game.getCurrentRound().advanceTurn();
        game.getCurrentRound().advanceTurn();

        trumpPhaseService.chooseBotTrumpOrSchedule(game);

        assertThat(game.getCurrentRound().getRoundStatus()).isEqualTo(RoundStatus.CHOOSING_TRUMP);
        verify(scheduledTaskRegistry).registerTask(org.mockito.ArgumentMatchers.argThat(task ->
                task.getType() == ScheduledTaskType.BOT_TRUMP_CHOICE_TASK
                        && task.getDelay().equals(Duration.ofSeconds(1))
                        && task.getRequiredIntParameter("roundNumber") == 0
                        && task.getRequiredIntParameter("turnIndex") == 3
        ));
        verify(gamePublisher, never()).trumpChosen(any(), any(Integer.class), any(Suite.class), any(RoundStatus.class), any(Map.class));
    }

    @Test
    void delayedLastBotTrumpChooserChoosesAndStartsCardPlay() {
        BeloteGame game = choosingTrumpGame(false, false, false, true);
        game.getCurrentRound().advanceTurn();
        game.getCurrentRound().advanceTurn();
        game.getCurrentRound().advanceTurn();
        when(gameAccessService.requireGameById("game-1")).thenReturn(game);

        trumpPhaseService.handleBotTrumpChoice("game-1", 0, 3);

        assertThat(game.getCurrentRound().getRoundStatus()).isEqualTo(RoundStatus.PLAYING);
        verify(gamePublisher).trumpChosen(eq(game), eq(3), any(Suite.class), eq(RoundStatus.PLAYING), any(Map.class));
        verify(cardPlayService).playBotTurnOrSchedule(game);
        verify(scheduledTaskRegistry, never()).registerTask(any(ScheduledGameTask.class));
    }

    private BeloteGame choosingTrumpGame() {
        return choosingTrumpGame(false, false, false, false);
    }

    private BeloteGame choosingTrumpGame(boolean p0Bot, boolean p1Bot, boolean p2Bot, boolean p3Bot) {
        List<GamePlayer> players = List.of(
                new GamePlayer("p0", 0, p0Bot),
                new GamePlayer("p1", 1, p1Bot),
                new GamePlayer("p2", 2, p2Bot),
                new GamePlayer("p3", 3, p3Bot)
        );
        TeamPair teams = Team.pairFrom(players);
        BeloteGame game = BeloteGame.builder()
                .id("game-1")
                .team1(teams.teamA())
                .team2(teams.teamB())
                .maxPoints(1001)
                .status(GameStatus.IN_PROGRESS)
                .build();
        game.createNewRound();
        game.getPlayer(0).receiveCards(List.of(visible(Suite.HEARTS, Rank.ACE), hidden(Suite.BELLS, Rank.SEVEN)));
        game.getPlayer(1).receiveCards(List.of(visible(Suite.BELLS, Rank.ACE), hidden(Suite.ACORN, Rank.SEVEN)));
        game.getPlayer(2).receiveCards(List.of(visible(Suite.ACORN, Rank.ACE), hidden(Suite.LEAF, Rank.SEVEN)));
        game.getPlayer(3).receiveCards(List.of(visible(Suite.LEAF, Rank.ACE), hidden(Suite.HEARTS, Rank.SEVEN)));
        return game;
    }

    private Card visible(Suite suite, Rank rank) {
        return new Card(suite, rank, false);
    }

    private Card hidden(Suite suite, Rank rank) {
        Card card = visible(suite, rank);
        card.setHidden(true);
        return card;
    }
}
