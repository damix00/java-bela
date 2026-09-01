package pro.damjan.belabackend.game.service.play;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import pro.damjan.belabackend.game.events.BeloteGameEventPublisher;
import pro.damjan.belabackend.game.model.BeloteGame;
import pro.damjan.belabackend.game.model.GameStatus;
import pro.damjan.belabackend.game.model.card.Card;
import pro.damjan.belabackend.game.model.config.GameConfiguration;
import pro.damjan.belabackend.game.model.card.Rank;
import pro.damjan.belabackend.game.model.card.Suite;
import pro.damjan.belabackend.game.model.player.GamePlayer;
import pro.damjan.belabackend.game.model.player.Team;
import pro.damjan.belabackend.game.model.player.TeamPair;
import pro.damjan.belabackend.game.model.round.RoundStatus;
import pro.damjan.belabackend.game.scheduling.registry.ScheduledTaskRegistry;
import pro.damjan.belabackend.game.scheduling.tasks.ScheduledGameTask;
import pro.damjan.belabackend.game.scheduling.tasks.ScheduledTaskType;
import pro.damjan.belabackend.game.service.access.GameAccessService;

import java.time.Duration;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
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
        GameFlowService gameFlowService =
                new GameFlowService(gameAccessService, gamePublisher, scheduledTaskRegistry);
        trumpPhaseService = new TrumpPhaseService(
                gameAccessService, gamePublisher, scheduledTaskRegistry, cardPlayService, gameFlowService);
    }

    @Test
    void chooseTrumpRevealsCardsAndAsksTheTableBeforeCardPlay() {
        BeloteGame game = choosingTrumpGame();
        when(gameAccessService.requireUserGame("p0")).thenReturn(game);

        trumpPhaseService.chooseTrump("p0", Suite.HEARTS);

        var round = game.getCurrentRound();
        assertThat(round.getRoundStatus()).isEqualTo(RoundStatus.DECLARING);
        assertThat(round.getTrumpSuite()).isEqualTo(Suite.HEARTS);
        assertThat(round.getCurrentTrick()).isNull();
        assertThat(game.getPlayers())
                .allSatisfy(player -> assertThat(player.getHand()).allSatisfy(card -> {
                    assertThat(card.isHidden()).isFalse();
                    assertThat(card.isTrump()).isEqualTo(card.getSuite() == Suite.HEARTS);
                }));

        verify(gameAccessService).save(game);
        verify(gamePublisher).trumpChosen(eq(game), eq(0), eq(Suite.HEARTS), eq(RoundStatus.DECLARING), any(Map.class), eq(10L));
        verify(gamePublisher, never()).cardTurnStarted(any(), any(Long.class));
        verify(scheduledTaskRegistry).registerTask(org.mockito.ArgumentMatchers.argThat(task ->
                task.getType() == ScheduledTaskType.DECLARATION_ASK_TIMEOUT_TASK
                        && task.getDelay().equals(Duration.ofSeconds(10))
                        && task.getRequiredIntParameter("roundNumber") == 0
        ));
    }

    @Test
    void everySeatIsAskedEvenWhenTheTableHoldsNothing() {
        // A phase that only happened when somebody held zvanja would be the tell it is trying not
        // to be, so the question is asked of a table holding two cards each and nothing else.
        BeloteGame game = choosingTrumpGame();
        when(gameAccessService.requireUserGame("p0")).thenReturn(game);

        trumpPhaseService.chooseTrump("p0", Suite.HEARTS);

        assertThat(game.getCurrentRound().getRoundStatus()).isEqualTo(RoundStatus.DECLARING);
        assertThat(game.getCurrentRound().hasDeclarations()).isFalse();
        assertThat(game.getCurrentRound().answeredDeclarationSeats()).isEmpty();
    }

    @Test
    void everyoneAnsweringStartsCardPlayWithoutWaitingOutTheClock() {
        BeloteGame game = choosingTrumpGame();
        when(gameAccessService.requireUserGame("p0")).thenReturn(game);
        when(gameAccessService.requireUserGame("p1")).thenReturn(game);
        when(gameAccessService.requireUserGame("p2")).thenReturn(game);
        when(gameAccessService.requireUserGame("p3")).thenReturn(game);
        trumpPhaseService.chooseTrump("p0", Suite.HEARTS);

        trumpPhaseService.answerDeclarations("p0", true);
        trumpPhaseService.answerDeclarations("p1", true);
        trumpPhaseService.answerDeclarations("p2", true);
        assertThat(game.getCurrentRound().getRoundStatus()).isEqualTo(RoundStatus.DECLARING);

        trumpPhaseService.answerDeclarations("p3", true);

        var round = game.getCurrentRound();
        assertThat(round.getRoundStatus()).isEqualTo(RoundStatus.PLAYING);
        assertThat(round.getCurrentTurnIndex()).isEqualTo(0);
        assertThat(round.getCurrentTrickNumber()).isEqualTo(0);
        assertThat(round.getCurrentTrick()).isNotNull();
        verify(scheduledTaskRegistry).removeGameTasksOfType("game-1", ScheduledTaskType.DECLARATION_ASK_TIMEOUT_TASK);
        verify(gamePublisher).cardTurnStarted(game, 30L);
        verify(cardPlayService).playBotTurnOrSchedule(game);
    }

    @Test
    void botSeatsAnswerForThemselvesSoOneHumanClosesTheWindow() {
        BeloteGame game = choosingTrumpGame(false, true, true, true);
        when(gameAccessService.requireUserGame("p0")).thenReturn(game);
        trumpPhaseService.chooseTrump("p0", Suite.HEARTS);

        assertThat(game.getCurrentRound().answeredDeclarationSeats()).containsExactly(1, 2, 3);

        trumpPhaseService.answerDeclarations("p0", true);

        assertThat(game.getCurrentRound().getRoundStatus()).isEqualTo(RoundStatus.PLAYING);
    }

    @Test
    void askTimeoutTreatsSilenceAsDeclaring() {
        BeloteGame game = choosingTrumpGame();
        game.getPlayer(0).receiveCards(fourJacks());
        when(gameAccessService.requireUserGame("p0")).thenReturn(game);
        when(gameAccessService.requireGameById("game-1")).thenReturn(game);
        trumpPhaseService.chooseTrump("p0", Suite.HEARTS);

        trumpPhaseService.handleDeclarationAskTimeout("game-1", 0);

        var round = game.getCurrentRound();
        assertThat(round.getRoundStatus()).isEqualTo(RoundStatus.DECLARATIONS);
        assertThat(round.getRoundPlayers()).allSatisfy(player -> {
            assertThat(player.isDeclarationAnswered()).isTrue();
            assertThat(player.isChoosesToDeclare()).isTrue();
        });
        verify(gamePublisher).declarationsRevealed(game, 5L);
    }

    @Test
    void askTimeoutFromAStaleRoundIsIgnored() {
        BeloteGame game = choosingTrumpGame();
        when(gameAccessService.requireUserGame("p0")).thenReturn(game);
        when(gameAccessService.requireGameById("game-1")).thenReturn(game);
        trumpPhaseService.chooseTrump("p0", Suite.HEARTS);

        trumpPhaseService.handleDeclarationAskTimeout("game-1", 7);

        assertThat(game.getCurrentRound().getRoundStatus()).isEqualTo(RoundStatus.DECLARING);
    }

    @Test
    void aTableThatAllDeclinesSkipsTheRevealAndPlays() {
        BeloteGame game = choosingTrumpGame();
        game.getPlayer(0).receiveCards(fourJacks());
        when(gameAccessService.requireUserGame("p0")).thenReturn(game);
        when(gameAccessService.requireUserGame("p1")).thenReturn(game);
        when(gameAccessService.requireUserGame("p2")).thenReturn(game);
        when(gameAccessService.requireUserGame("p3")).thenReturn(game);
        trumpPhaseService.chooseTrump("p0", Suite.HEARTS);

        trumpPhaseService.answerDeclarations("p0", false);
        trumpPhaseService.answerDeclarations("p1", false);
        trumpPhaseService.answerDeclarations("p2", false);
        trumpPhaseService.answerDeclarations("p3", false);

        assertThat(game.getCurrentRound().getRoundStatus()).isEqualTo(RoundStatus.PLAYING);
        assertThat(game.getCurrentRound().getTeam1RoundScore()).isZero();
        verify(gamePublisher, never()).declarationsRevealed(any(), anyLong());
        verify(scheduledTaskRegistry, never()).registerTask(org.mockito.ArgumentMatchers.argThat(task ->
                task.getType() == ScheduledTaskType.DECLARATIONS_COMPLETE_TASK
        ));
    }

    @Test
    void aSecondAnswerFromTheSameSeatCannotAdvanceTheRoundTwice() {
        // Answers are serialized on the game lock, so simultaneous ones arrive one after the other
        // and the loser reads the state the winner saved. A duplicate — a double click, a retried
        // command, two seats answering in the same millisecond — therefore lands after the phase
        // has already moved, where the guard turns it away rather than revealing a second time.
        BeloteGame game = choosingTrumpGame();
        game.getPlayer(0).receiveCards(fourJacks());
        when(gameAccessService.requireUserGame("p0")).thenReturn(game);
        when(gameAccessService.requireUserGame("p1")).thenReturn(game);
        when(gameAccessService.requireUserGame("p2")).thenReturn(game);
        when(gameAccessService.requireUserGame("p3")).thenReturn(game);
        trumpPhaseService.chooseTrump("p0", Suite.HEARTS);
        trumpPhaseService.answerDeclarations("p0", true);
        trumpPhaseService.answerDeclarations("p1", true);
        trumpPhaseService.answerDeclarations("p2", true);
        trumpPhaseService.answerDeclarations("p3", true);

        assertThatThrownBy(() -> trumpPhaseService.answerDeclarations("p3", true))
                .isInstanceOf(IllegalStateException.class);

        assertThat(game.getCurrentRound().getRoundStatus()).isEqualTo(RoundStatus.DECLARATIONS);
        verify(gamePublisher, org.mockito.Mockito.times(1)).declarationsRevealed(game, 5L);
    }

    @Test
    void anAskTimeoutThatFiresAfterAnEarlyCloseChangesNothing() {
        BeloteGame game = choosingTrumpGame();
        game.getPlayer(0).receiveCards(fourJacks());
        when(gameAccessService.requireUserGame("p0")).thenReturn(game);
        when(gameAccessService.requireUserGame("p1")).thenReturn(game);
        when(gameAccessService.requireUserGame("p2")).thenReturn(game);
        when(gameAccessService.requireUserGame("p3")).thenReturn(game);
        when(gameAccessService.requireGameById("game-1")).thenReturn(game);
        trumpPhaseService.chooseTrump("p0", Suite.HEARTS);
        trumpPhaseService.answerDeclarations("p0", true);
        trumpPhaseService.answerDeclarations("p1", true);
        trumpPhaseService.answerDeclarations("p2", true);
        trumpPhaseService.answerDeclarations("p3", true);

        // The task was cancelled, but a copy already past the cancel and waiting on the lock is
        // exactly the case the status guard is for.
        trumpPhaseService.handleDeclarationAskTimeout("game-1", 0);

        assertThat(game.getCurrentRound().getRoundStatus()).isEqualTo(RoundStatus.DECLARATIONS);
        verify(gamePublisher, org.mockito.Mockito.times(1)).declarationsRevealed(game, 5L);
    }

    @Test
    void aLateAnswerCannotUndoADeclarationOnceTheRevealHasStarted() {
        BeloteGame game = choosingTrumpGame();
        game.getPlayer(0).receiveCards(fourJacks());
        when(gameAccessService.requireUserGame("p0")).thenReturn(game);
        when(gameAccessService.requireGameById("game-1")).thenReturn(game);
        trumpPhaseService.chooseTrump("p0", Suite.HEARTS);
        trumpPhaseService.handleDeclarationAskTimeout("game-1", 0);

        assertThatThrownBy(() -> trumpPhaseService.answerDeclarations("p0", false))
                .isInstanceOf(IllegalStateException.class);

        assertThat(game.getCurrentRound().getTeam1RoundScore()).isEqualTo(200);
    }

    @Test
    void answeringOutsideTheAskPhaseIsRejected() {
        BeloteGame game = choosingTrumpGame();
        when(gameAccessService.requireUserGame("p0")).thenReturn(game);

        assertThatThrownBy(() -> trumpPhaseService.answerDeclarations("p0", false))
                .isInstanceOf(IllegalStateException.class);
    }

    @Test
    void revealCompleteStartsCardPlay() {
        BeloteGame game = choosingTrumpGame();
        game.getPlayer(0).receiveCards(fourJacks());
        when(gameAccessService.requireUserGame("p0")).thenReturn(game);
        when(gameAccessService.requireGameById("game-1")).thenReturn(game);
        trumpPhaseService.chooseTrump("p0", Suite.HEARTS);
        trumpPhaseService.handleDeclarationAskTimeout("game-1", 0);

        trumpPhaseService.handleDeclarationsComplete("game-1", 0);

        assertThat(game.getCurrentRound().getRoundStatus()).isEqualTo(RoundStatus.PLAYING);
        assertThat(game.getCurrentRound().getCurrentTrick()).isNotNull();
        verify(gamePublisher).cardTurnStarted(game, 30L);
    }

    @Test
    void chosenTrumpCallerDoesNotChangeFirstTrickLeader() {
        BeloteGame game = choosingTrumpGame();
        game.getCurrentRound().advanceTurn();
        game.getCurrentRound().advanceTurn();
        when(gameAccessService.requireUserGame("p2")).thenReturn(game);

        when(gameAccessService.requireGameById("game-1")).thenReturn(game);

        trumpPhaseService.chooseTrump("p2", Suite.ACORN);
        trumpPhaseService.handleDeclarationAskTimeout("game-1", 0);

        var round = game.getCurrentRound();
        assertThat(round.getRoundStatus()).isEqualTo(RoundStatus.PLAYING);
        assertThat(round.getCurrentTurnIndex()).isEqualTo(0);
        assertThat(round.getCurrentTrickNumber()).isEqualTo(0);
        verify(gamePublisher).trumpChosen(eq(game), eq(2), eq(Suite.ACORN), eq(RoundStatus.DECLARING), any(Map.class), anyLong());
    }

    @Test
    void passTrumpAdvancesChooserAndSchedulesNextTrumpTimeout() {
        BeloteGame game = choosingTrumpGame();
        when(gameAccessService.requireUserGame("p0")).thenReturn(game);

        trumpPhaseService.passTrump("p0");

        assertThat(game.getCurrentRound().getCurrentTurnIndex()).isEqualTo(1);
        verify(gameAccessService).save(game);
        verify(gamePublisher).trumpChoiceSkipped(
                eq(game), eq(0), eq("p0"), any(List.class), eq(TrumpPhaseService.TRUMP_CHOICE_TIMEOUT.toSeconds()));
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
        assertThat(game.getPlayer(1).getHand()).noneMatch(Card::isHidden);
        verify(gameAccessService).save(game);
        verify(gamePublisher).trumpChoiceSkipped(
                eq(game), eq(1), eq("p1"), any(List.class), eq(TrumpPhaseService.TRUMP_CHOICE_TIMEOUT.toSeconds()));
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
        verify(gamePublisher, never()).trumpChosen(any(), any(Integer.class), any(Suite.class), any(RoundStatus.class), any(Map.class), anyLong());
    }

    @Test
    void delayedLastBotTrumpChooserChoosesAndAsksTheTable() {
        BeloteGame game = choosingTrumpGame(false, false, false, true);
        game.getCurrentRound().advanceTurn();
        game.getCurrentRound().advanceTurn();
        game.getCurrentRound().advanceTurn();
        when(gameAccessService.requireGameById("game-1")).thenReturn(game);

        trumpPhaseService.handleBotTrumpChoice("game-1", 0, 3);

        assertThat(game.getCurrentRound().getRoundStatus()).isEqualTo(RoundStatus.DECLARING);
        verify(gamePublisher).trumpChosen(eq(game), eq(3), any(Suite.class), eq(RoundStatus.DECLARING), any(Map.class), anyLong());
        verify(cardPlayService, never()).playBotTurnOrSchedule(game);
        verify(scheduledTaskRegistry).registerTask(org.mockito.ArgumentMatchers.argThat(task ->
                task.getType() == ScheduledTaskType.DECLARATION_ASK_TIMEOUT_TASK
        ));
    }

    @Test
    void declarationsAreRevealedForFiveSecondsOnceEveryoneHasAnswered() {
        BeloteGame game = choosingTrumpGame();
        game.getPlayer(0).receiveCards(fourJacks());
        when(gameAccessService.requireUserGame("p0")).thenReturn(game);
        when(gameAccessService.requireUserGame("p1")).thenReturn(game);
        when(gameAccessService.requireUserGame("p2")).thenReturn(game);
        when(gameAccessService.requireUserGame("p3")).thenReturn(game);
        trumpPhaseService.chooseTrump("p0", Suite.HEARTS);

        trumpPhaseService.answerDeclarations("p0", true);
        trumpPhaseService.answerDeclarations("p1", true);
        trumpPhaseService.answerDeclarations("p2", true);
        trumpPhaseService.answerDeclarations("p3", true);

        var round = game.getCurrentRound();
        assertThat(round.getRoundStatus()).isEqualTo(RoundStatus.DECLARATIONS);
        assertThat(round.getCurrentTrick()).isNull();
        assertThat(round.getDeclarations(0).stream()
                .mapToInt(pro.damjan.belabackend.game.model.card.Declaration::getPoints).sum()).isEqualTo(200);
        assertThat(round.getTeam1RoundScore()).isEqualTo(200);

        verify(gamePublisher).declarationsRevealed(game, 5L);
        verify(gamePublisher, never()).cardTurnStarted(any(), any(Long.class));
        verify(cardPlayService, never()).playBotTurnOrSchedule(game);
        verify(scheduledTaskRegistry).removeGameTasksOfType("game-1", ScheduledTaskType.DECLARATION_ASK_TIMEOUT_TASK);
        verify(scheduledTaskRegistry).registerTask(org.mockito.ArgumentMatchers.argThat(task ->
                task.getType() == ScheduledTaskType.DECLARATIONS_COMPLETE_TASK
                        && task.getDelay().equals(Duration.ofSeconds(5))
                        && task.getRequiredIntParameter("roundNumber") == 0
        ));
    }

    @Test
    void aDeclinedSetLosesTheContestToTheSetThatStayedIn() {
        BeloteGame game = choosingTrumpGame();
        game.getPlayer(0).receiveCards(fourJacks());
        game.getPlayer(1).receiveCards(List.of(
                visible(Suite.BELLS, Rank.SEVEN),
                visible(Suite.BELLS, Rank.EIGHT),
                visible(Suite.BELLS, Rank.NINE)
        ));
        when(gameAccessService.requireUserGame("p0")).thenReturn(game);
        when(gameAccessService.requireUserGame("p1")).thenReturn(game);
        when(gameAccessService.requireUserGame("p2")).thenReturn(game);
        when(gameAccessService.requireUserGame("p3")).thenReturn(game);
        trumpPhaseService.chooseTrump("p0", Suite.HEARTS);

        trumpPhaseService.answerDeclarations("p0", false);
        trumpPhaseService.answerDeclarations("p1", true);
        trumpPhaseService.answerDeclarations("p2", true);
        trumpPhaseService.answerDeclarations("p3", true);

        var round = game.getCurrentRound();
        assertThat(round.getRoundStatus()).isEqualTo(RoundStatus.DECLARATIONS);
        assertThat(round.getDeclarations(0)).isEmpty();
        assertThat(round.getTeam2RoundScore()).isEqualTo(20);
    }

    @Test
    void belotDeclarationFinishesRoundAndSchedulesNextRoundWithoutFinishingGame() {
        BeloteGame game = choosingTrumpGame();
        game.getPlayer(0).receiveCards(List.of(
                visible(Suite.HEARTS, Rank.SEVEN),
                visible(Suite.HEARTS, Rank.EIGHT),
                visible(Suite.HEARTS, Rank.NINE),
                visible(Suite.HEARTS, Rank.TEN),
                visible(Suite.HEARTS, Rank.JACK),
                visible(Suite.HEARTS, Rank.QUEEN),
                hidden(Suite.HEARTS, Rank.KING),
                hidden(Suite.HEARTS, Rank.ACE)
        ));
        when(gameAccessService.requireUserGame("p0")).thenReturn(game);

        trumpPhaseService.chooseTrump("p0", Suite.BELLS);

        assertThat(game.getStatus()).isEqualTo(GameStatus.IN_PROGRESS);
        assertThat(game.getTeam1().getTotalScore()).isEqualTo(162);
        assertThat(game.getTeam2().getTotalScore()).isZero();
        assertThat(game.getCurrentRound().getRoundStatus()).isEqualTo(RoundStatus.FINISHED);
        assertThat(game.getCurrentRound().getCurrentTrick()).isNull();
        assertThat(game.getCurrentRound().getDeclarations(0))
                .singleElement()
                .extracting(declaration -> declaration.getType())
                .isEqualTo(pro.damjan.belabackend.game.model.card.Declaration.Type.BELOTE);

        verify(gameAccessService).save(game);
        verify(gamePublisher).trumpChosen(eq(game), eq(0), eq(Suite.BELLS), eq(RoundStatus.FINISHED), any(Map.class), anyLong());
        verify(gamePublisher, never()).statusChanged(game);
        verify(gamePublisher, never()).cardTurnStarted(any(), any(Long.class));
        verify(cardPlayService, never()).playBotTurnOrSchedule(game);
        verify(scheduledTaskRegistry).registerTask(org.mockito.ArgumentMatchers.argThat(task ->
                task.getType() == ScheduledTaskType.ROUND_START_TASK
                        && task.getDelay().equals(Duration.ofSeconds(5))
                        && task.getRequiredIntParameter("roundNumber") == 1
        ));
    }

    @Test
    void chooseTrumpRejectsNullSuiteWithoutMutatingTheRound() {
        BeloteGame game = choosingTrumpGame();
        when(gameAccessService.requireUserGame("p0")).thenReturn(game);

        assertThatThrownBy(() -> trumpPhaseService.chooseTrump("p0", null))
                .isInstanceOf(IllegalArgumentException.class);

        var round = game.getCurrentRound();
        assertThat(round.getRoundStatus()).isEqualTo(RoundStatus.CHOOSING_TRUMP);
        assertThat(round.getTrumpSuite()).isNull();
        verify(gameAccessService, never()).save(any());
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
                .config(GameConfiguration.ranked())
                .status(GameStatus.IN_PROGRESS)
                .build();
        game.createNewRound();
        game.getPlayer(0).receiveCards(List.of(visible(Suite.HEARTS, Rank.ACE), hidden(Suite.BELLS, Rank.SEVEN)));
        game.getPlayer(1).receiveCards(List.of(visible(Suite.BELLS, Rank.ACE), hidden(Suite.ACORN, Rank.SEVEN)));
        game.getPlayer(2).receiveCards(List.of(visible(Suite.ACORN, Rank.ACE), hidden(Suite.LEAF, Rank.SEVEN)));
        game.getPlayer(3).receiveCards(List.of(visible(Suite.LEAF, Rank.ACE), hidden(Suite.HEARTS, Rank.SEVEN)));
        return game;
    }

    private List<Card> fourJacks() {
        return List.of(
                visible(Suite.HEARTS, Rank.JACK),
                visible(Suite.BELLS, Rank.JACK),
                visible(Suite.ACORN, Rank.JACK),
                visible(Suite.LEAF, Rank.JACK)
        );
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
