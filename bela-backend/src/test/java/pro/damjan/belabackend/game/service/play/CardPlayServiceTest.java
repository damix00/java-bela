package pro.damjan.belabackend.game.service.play;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InOrder;
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
import pro.damjan.belabackend.game.service.access.GameAccessService;

import java.time.Duration;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.inOrder;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class CardPlayServiceTest {

    private GameAccessService gameAccessService;
    private BeloteGameEventPublisher gamePublisher;
    private ScheduledTaskRegistry scheduledTaskRegistry;
    private CardPlayService cardPlayService;

    @BeforeEach
    void setUp() {
        gameAccessService = mock(GameAccessService.class);
        gamePublisher = mock(BeloteGameEventPublisher.class);
        scheduledTaskRegistry = mock(ScheduledTaskRegistry.class);
        cardPlayService = new CardPlayService(gameAccessService, gamePublisher, scheduledTaskRegistry);
    }

    @Test
    void fourthCardCompletesTrickAndSchedulesDelayedNextTrickStart() {
        BeloteGame game = playingGameWithHands(
                List.of(card(Suite.HEARTS, Rank.SEVEN), card(Suite.BELLS, Rank.SEVEN)),
                List.of(card(Suite.HEARTS, Rank.EIGHT), card(Suite.BELLS, Rank.EIGHT)),
                List.of(card(Suite.HEARTS, Rank.NINE), card(Suite.BELLS, Rank.NINE)),
                List.of(card(Suite.HEARTS, Rank.ACE), card(Suite.BELLS, Rank.ACE))
        );
        preplayCard(game, 0, Suite.HEARTS, Rank.SEVEN);
        preplayCard(game, 1, Suite.HEARTS, Rank.EIGHT);
        preplayCard(game, 2, Suite.HEARTS, Rank.NINE);
        when(gameAccessService.requireUserGame("p3")).thenReturn(game);

        cardPlayService.throwCard("p3", Suite.HEARTS, Rank.ACE);

        var round = game.getCurrentRound();
        assertThat(round.getRoundStatus()).isEqualTo(RoundStatus.PLAYING);
        assertThat(round.getTricks()).hasSize(1);
        assertThat(round.getTricks().get(0).isComplete()).isTrue();
        assertThat(round.getTricks().get(0).getWinningPlayerIndex()).isEqualTo(3);
        assertThat(round.getCurrentTrickNumber()).isEqualTo(0);
        assertThat(round.getCurrentTrick()).isSameAs(round.getTricks().get(0));
        assertThat(round.getCurrentTurnIndex()).isEqualTo(3);

        verify(scheduledTaskRegistry).registerTask(org.mockito.ArgumentMatchers.argThat(task ->
                task.getType() == ScheduledTaskType.NEXT_TRICK_START_TASK
                        && task.getDelay().equals(Duration.ofSeconds(3))
                        && task.getGameId().equals("game-1")
                        && task.getRequiredIntParameter("roundNumber") == 0
                        && task.getRequiredIntParameter("completedTrickNumber") == 0
                        && task.getRequiredIntParameter("winningTurnIndex") == 3
        ));
        verify(gamePublisher).cardThrown(
                eq(game),
                eq(0),
                eq(0),
                eq(3),
                any(Card.class),
                eq(false),
                eq(true),
                eq(true),
                eq(3),
                eq(0L)
        );
        verify(gamePublisher, never()).cardTurnStarted(game, 30L);

        InOrder order = inOrder(gameAccessService, gamePublisher, scheduledTaskRegistry);
        order.verify(gameAccessService).save(game);
        order.verify(gamePublisher).cardThrown(
                eq(game),
                eq(0),
                eq(0),
                eq(3),
                any(Card.class),
                eq(false),
                eq(true),
                eq(true),
                eq(3),
                eq(0L)
        );
        order.verify(scheduledTaskRegistry).registerTask(any(ScheduledGameTask.class));
    }

    @Test
    void roundKeepsCompletedTrickActiveUntilDelayedNextTrickStart() {
        BeloteGame game = playingGameWithHands(
                List.of(card(Suite.HEARTS, Rank.SEVEN), card(Suite.BELLS, Rank.SEVEN)),
                List.of(card(Suite.HEARTS, Rank.EIGHT), card(Suite.BELLS, Rank.EIGHT)),
                List.of(card(Suite.HEARTS, Rank.NINE), card(Suite.BELLS, Rank.NINE)),
                List.of(card(Suite.HEARTS, Rank.ACE), card(Suite.BELLS, Rank.ACE))
        );

        preplayCard(game, 0, Suite.HEARTS, Rank.SEVEN);
        preplayCard(game, 1, Suite.HEARTS, Rank.EIGHT);
        preplayCard(game, 2, Suite.HEARTS, Rank.NINE);
        preplayCard(game, 3, Suite.HEARTS, Rank.ACE);

        var round = game.getCurrentRound();
        assertThat(round.getRoundStatus()).isEqualTo(RoundStatus.PLAYING);
        assertThat(round.getTricks()).hasSize(1);
        assertThat(round.getTricks().get(0).isComplete()).isTrue();
        assertThat(round.getCurrentTrickNumber()).isEqualTo(0);
        assertThat(round.getCurrentTrick()).isSameAs(round.getTricks().get(0));
        assertThat(round.getCurrentTurnIndex()).isEqualTo(3);
    }

    @Test
    void fourthCardOfFinalTrickFinishesRoundAndSchedulesNextRound() {
        BeloteGame game = playingGameWithHands(
                List.of(card(Suite.HEARTS, Rank.SEVEN)),
                List.of(card(Suite.HEARTS, Rank.EIGHT)),
                List.of(card(Suite.HEARTS, Rank.NINE)),
                List.of(card(Suite.HEARTS, Rank.ACE))
        );
        preplayCard(game, 0, Suite.HEARTS, Rank.SEVEN);
        preplayCard(game, 1, Suite.HEARTS, Rank.EIGHT);
        preplayCard(game, 2, Suite.HEARTS, Rank.NINE);
        when(gameAccessService.requireUserGame("p3")).thenReturn(game);

        cardPlayService.throwCard("p3", Suite.HEARTS, Rank.ACE);

        var round = game.getCurrentRound();
        assertThat(round.getRoundStatus()).isEqualTo(RoundStatus.FINISHED);
        assertThat(round.getTricks()).hasSize(1);
        assertThat(round.getCurrentTrick()).isSameAs(round.getTricks().get(0));
        assertThat(round.getCurrentTrick().isComplete()).isTrue();

        verify(scheduledTaskRegistry).registerTask(org.mockito.ArgumentMatchers.argThat(task ->
                task.getType() == ScheduledTaskType.ROUND_START_TASK
                        && task.getDelay().equals(Duration.ofSeconds(5))
                        && task.getGameId().equals("game-1")
                        && task.getRequiredIntParameter("roundNumber") == 1
        ));
        verify(gamePublisher, never()).cardTurnStarted(any(), any(Long.class));
        verify(gamePublisher).cardThrown(
                eq(game),
                eq(0),
                eq(0),
                eq(3),
                any(Card.class),
                eq(false),
                eq(true),
                eq(false),
                eq(3),
                eq(0L)
        );
    }

    @Test
    void staleCardTimeoutDoesNothing() {
        BeloteGame game = playingGameWithHands(
                List.of(card(Suite.HEARTS, Rank.SEVEN)),
                List.of(card(Suite.HEARTS, Rank.EIGHT)),
                List.of(card(Suite.HEARTS, Rank.NINE)),
                List.of(card(Suite.HEARTS, Rank.ACE))
        );
        when(gameAccessService.requireGameById("game-1")).thenReturn(game);

        cardPlayService.handleCardThrowTimeout("game-1", 0, 99, 0);

        verify(gameAccessService, never()).save(any());
        verify(gamePublisher, never()).cardThrown(any(), any(Integer.class), any(Integer.class), any(Integer.class), any(), any(Boolean.class), any(Boolean.class), any(Boolean.class), any(), any(Long.class));
        verify(scheduledTaskRegistry, never()).registerTask(any());
    }

    @Test
    void manualThrowRejectsWrongTurnWrongPhaseHiddenMissingAndNoActiveTrick() {
        BeloteGame game = playingGameWithHands(
                List.of(card(Suite.HEARTS, Rank.SEVEN)),
                List.of(card(Suite.HEARTS, Rank.EIGHT)),
                List.of(card(Suite.HEARTS, Rank.NINE)),
                List.of(card(Suite.HEARTS, Rank.ACE))
        );
        when(gameAccessService.requireUserGame("p1")).thenReturn(game);

        assertThatThrownBy(() -> cardPlayService.throwCard("p1", Suite.HEARTS, Rank.EIGHT))
                .isInstanceOf(IllegalStateException.class)
                .hasMessage("It is not this player's turn to throw a card");

        game.getCurrentRound().setRoundStatus(RoundStatus.FINISHED);
        when(gameAccessService.requireUserGame("p0")).thenReturn(game);
        assertThatThrownBy(() -> cardPlayService.throwCard("p0", Suite.HEARTS, Rank.SEVEN))
                .isInstanceOf(IllegalStateException.class)
                .hasMessage("Round is not accepting cards");

        BeloteGame hiddenGame = playingGameWithHands(
                List.of(hiddenCard(Suite.HEARTS, Rank.SEVEN)),
                List.of(card(Suite.HEARTS, Rank.EIGHT)),
                List.of(card(Suite.HEARTS, Rank.NINE)),
                List.of(card(Suite.HEARTS, Rank.ACE))
        );
        when(gameAccessService.requireUserGame("p0")).thenReturn(hiddenGame);
        assertThatThrownBy(() -> cardPlayService.throwCard("p0", Suite.HEARTS, Rank.SEVEN))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("Player does not have this card");

        when(gameAccessService.requireUserGame("p0")).thenReturn(hiddenGame);
        assertThatThrownBy(() -> cardPlayService.throwCard("p0", Suite.BELLS, Rank.SEVEN))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("Player does not have this card");

        BeloteGame noTrickGame = gameWithRoundStatus(RoundStatus.PLAYING);
        noTrickGame.getPlayer(0).receiveCards(List.of(card(Suite.HEARTS, Rank.SEVEN)));
        when(gameAccessService.requireUserGame("p0")).thenReturn(noTrickGame);
        assertThatThrownBy(() -> cardPlayService.throwCard("p0", Suite.HEARTS, Rank.SEVEN))
                .isInstanceOf(IllegalStateException.class)
                .hasMessage("Cannot throw card, no active trick or current trick is already complete");
    }

    @Test
    void completionSchedulesNextTrickStartTask() {
        BeloteGame game = playingGameWithHands(
                List.of(card(Suite.HEARTS, Rank.SEVEN), card(Suite.BELLS, Rank.SEVEN)),
                List.of(card(Suite.HEARTS, Rank.EIGHT), card(Suite.BELLS, Rank.EIGHT)),
                List.of(card(Suite.HEARTS, Rank.NINE), card(Suite.BELLS, Rank.NINE)),
                List.of(card(Suite.HEARTS, Rank.ACE), card(Suite.BELLS, Rank.ACE))
        );
        preplayCard(game, 0, Suite.HEARTS, Rank.SEVEN);
        preplayCard(game, 1, Suite.HEARTS, Rank.EIGHT);
        preplayCard(game, 2, Suite.HEARTS, Rank.NINE);
        when(gameAccessService.requireUserGame("p3")).thenReturn(game);

        cardPlayService.throwCard("p3", Suite.HEARTS, Rank.ACE);

        verify(scheduledTaskRegistry).registerTask(org.mockito.ArgumentMatchers.argThat(task ->
                task.getType() == ScheduledTaskType.NEXT_TRICK_START_TASK
                        && task.getGameId().equals("game-1")
                        && task.getDelay().equals(Duration.ofSeconds(3))
                        && task.getRequiredIntParameter("roundNumber") == 0
                        && task.getRequiredIntParameter("completedTrickNumber") == 0
                        && task.getRequiredIntParameter("winningTurnIndex") == 3
        ));
    }

    @Test
    void nextBotThrowIsScheduledWithOneSecondDelay() {
        BeloteGame game = playingGameWithHands(
                List.of(card(Suite.HEARTS, Rank.SEVEN)),
                List.of(card(Suite.HEARTS, Rank.EIGHT)),
                List.of(card(Suite.HEARTS, Rank.NINE)),
                List.of(card(Suite.HEARTS, Rank.ACE)),
                false,
                true,
                false,
                false
        );
        when(gameAccessService.requireUserGame("p0")).thenReturn(game);

        cardPlayService.throwCard("p0", Suite.HEARTS, Rank.SEVEN);

        verify(scheduledTaskRegistry).registerTask(org.mockito.ArgumentMatchers.argThat(task ->
                task.getType() == ScheduledTaskType.CARD_THROW_TIMEOUT_TASK
                        && task.getDelay().equals(Duration.ofSeconds(1))
                        && task.getRequiredIntParameter("trickNumber") == 0
                        && task.getRequiredIntParameter("turnIndex") == 1
        ));
        verify(gamePublisher).cardThrown(eq(game), eq(0), eq(0), eq(0), any(Card.class), eq(false), eq(false), eq(false), eq(null), eq(30L));
        verify(gamePublisher, never()).cardThrown(eq(game), eq(0), eq(0), eq(1), any(Card.class), eq(true), eq(false), eq(false), eq(null), eq(30L));
    }

    @Test
    void botWinningTrickSchedulesDelayedNextTrickBeforeBotLead() {
        BeloteGame game = playingGameWithHands(
                List.of(card(Suite.HEARTS, Rank.SEVEN), card(Suite.BELLS, Rank.SEVEN)),
                List.of(card(Suite.HEARTS, Rank.EIGHT), card(Suite.BELLS, Rank.EIGHT)),
                List.of(card(Suite.HEARTS, Rank.NINE), card(Suite.BELLS, Rank.NINE)),
                List.of(card(Suite.HEARTS, Rank.ACE), card(Suite.BELLS, Rank.ACE)),
                false,
                false,
                false,
                true
        );
        preplayCard(game, 0, Suite.HEARTS, Rank.SEVEN);
        preplayCard(game, 1, Suite.HEARTS, Rank.EIGHT);
        preplayCard(game, 2, Suite.HEARTS, Rank.NINE);
        when(gameAccessService.requireUserGame("p3")).thenReturn(game);

        cardPlayService.throwCard("p3", Suite.HEARTS, Rank.ACE);

        assertThat(game.getCurrentRound().getTricks()).hasSize(1);
        assertThat(game.getCurrentRound().getTricks().get(0).isComplete()).isTrue();
        verify(gamePublisher, never()).cardTurnStarted(game, 30L);
        verify(scheduledTaskRegistry).registerTask(org.mockito.ArgumentMatchers.argThat(task ->
                task.getType() == ScheduledTaskType.NEXT_TRICK_START_TASK
                        && task.getDelay().equals(Duration.ofSeconds(3))
                        && task.getRequiredIntParameter("completedTrickNumber") == 0
                        && task.getRequiredIntParameter("winningTurnIndex") == 3
        ));
    }

    @Test
    void delayedNextTrickStartOpensTrickPublishesTurnAndSchedulesWinner() {
        BeloteGame game = playingGameWithHands(
                List.of(card(Suite.HEARTS, Rank.SEVEN), card(Suite.BELLS, Rank.SEVEN)),
                List.of(card(Suite.HEARTS, Rank.EIGHT), card(Suite.BELLS, Rank.EIGHT)),
                List.of(card(Suite.HEARTS, Rank.NINE), card(Suite.BELLS, Rank.NINE)),
                List.of(card(Suite.HEARTS, Rank.ACE), card(Suite.BELLS, Rank.ACE)),
                false,
                false,
                false,
                true
        );
        preplayCard(game, 0, Suite.HEARTS, Rank.SEVEN);
        preplayCard(game, 1, Suite.HEARTS, Rank.EIGHT);
        preplayCard(game, 2, Suite.HEARTS, Rank.NINE);
        preplayCard(game, 3, Suite.HEARTS, Rank.ACE);
        when(gameAccessService.requireGameById("game-1")).thenReturn(game);

        cardPlayService.handleNextTrickStart("game-1", 0, 0, 3);

        assertThat(game.getCurrentRound().getTricks()).hasSize(2);
        assertThat(game.getCurrentRound().getCurrentTrickNumber()).isEqualTo(1);
        assertThat(game.getCurrentRound().getCurrentTrick().getPlayedCards()).isEmpty();
        verify(gameAccessService).save(game);
        verify(gamePublisher).cardTurnStarted(game, 30L);
        verify(scheduledTaskRegistry).registerTask(org.mockito.ArgumentMatchers.argThat(task ->
                task.getType() == ScheduledTaskType.CARD_THROW_TIMEOUT_TASK
                        && task.getDelay().equals(Duration.ofSeconds(1))
                        && task.getRequiredIntParameter("trickNumber") == 1
                        && task.getRequiredIntParameter("turnIndex") == 3
        ));
    }

    private BeloteGame playingGameWithHands(List<Card> p0, List<Card> p1, List<Card> p2, List<Card> p3) {
        return playingGameWithHands(p0, p1, p2, p3, false, false, false, false);
    }

    private BeloteGame playingGameWithHands(
            List<Card> p0,
            List<Card> p1,
            List<Card> p2,
            List<Card> p3,
            boolean p0Bot,
            boolean p1Bot,
            boolean p2Bot,
            boolean p3Bot
    ) {
        BeloteGame game = gameWithRoundStatus(RoundStatus.PLAYING, p0Bot, p1Bot, p2Bot, p3Bot);
        game.getPlayer(0).receiveCards(p0);
        game.getPlayer(1).receiveCards(p1);
        game.getPlayer(2).receiveCards(p2);
        game.getPlayer(3).receiveCards(p3);
        game.getCurrentRound().setTrumpSuite(Suite.LEAF);
        game.getCurrentRound().startNewTrick();
        return game;
    }

    private BeloteGame gameWithRoundStatus(RoundStatus status) {
        return gameWithRoundStatus(status, false, false, false, false);
    }

    private BeloteGame gameWithRoundStatus(RoundStatus status, boolean p0Bot, boolean p1Bot, boolean p2Bot, boolean p3Bot) {
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
        game.getCurrentRound().setRoundStatus(status);
        return game;
    }

    private void preplayCard(BeloteGame game, int playerIndex, Suite suite, Rank rank) {
        GamePlayer player = game.getPlayer(playerIndex);
        Card card = player.getHand().stream()
                .filter(c -> c.getSuite() == suite && c.getRank() == rank)
                .findFirst()
                .orElseThrow();
        var result = game.getCurrentRound().throwCard(player, card);
        assertThat(result.legalMove()).isTrue();
    }

    private Card card(Suite suite, Rank rank) {
        return new Card(suite, rank, false);
    }

    private Card hiddenCard(Suite suite, Rank rank) {
        Card card = card(suite, rank);
        card.setHidden(true);
        return card;
    }
}
