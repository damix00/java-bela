package pro.damjan.belabackend.game.events;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import pro.damjan.belabackend.game.events.dto.outgoing.CardThrownEvent;
import pro.damjan.belabackend.game.events.dto.outgoing.CardTurnStartedEvent;
import pro.damjan.belabackend.game.events.dto.outgoing.GameEndedEvent;
import pro.damjan.belabackend.game.events.dto.outgoing.GameSnapshotEvent;
import pro.damjan.belabackend.game.events.dto.outgoing.GameStatusChangedEvent;
import pro.damjan.belabackend.game.events.dto.outgoing.PerspectiveOutgoingEvent;
import pro.damjan.belabackend.game.events.dto.outgoing.RoundStartEvent;
import pro.damjan.belabackend.game.events.dto.outgoing.TrumpChoiceSkippedEvent;
import pro.damjan.belabackend.game.events.dto.outgoing.TrumpChosenEvent;
import pro.damjan.belabackend.game.events.dto.outgoing.TrumpChoosingStartedEvent;
import pro.damjan.belabackend.game.model.BeloteGame;
import pro.damjan.belabackend.game.model.card.Card;
import pro.damjan.belabackend.game.model.card.CardOrdering;
import pro.damjan.belabackend.game.model.card.Suite;
import pro.damjan.belabackend.game.model.player.GamePlayer;
import pro.damjan.belabackend.game.model.round.BeloteRound;
import pro.damjan.belabackend.game.model.round.RoundStatus;
import pro.damjan.belabackend.game.scheduling.registry.ScheduledTaskRegistry;
import pro.damjan.belabackend.game.scheduling.tasks.ScheduledTaskType;
import pro.damjan.belabackend.websocket.events.WebSocketPublisher;
import pro.damjan.belabackend.websocket.events.dto.OutgoingEvent;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class BeloteGameEventPublisher {

    private final WebSocketPublisher webSocketPublisher;
    private final ScheduledTaskRegistry scheduledTaskRegistry;

    // Identifies which client-facing countdown is running for the current round so a (re)connecting
    // client can rebuild the right indicator. Returns null when no client-facing timer is active.
    private ScheduledTaskType activeTimerType(BeloteRound round) {
        if (round == null) {
            return null;
        }

        return switch (round.getRoundStatus()) {
            case CHOOSING_TRUMP -> ScheduledTaskType.CHOOSING_TRUMP_TIMEOUT_TASK;
            case PLAYING -> round.getCurrentTrick() != null && round.getCurrentTrick().isComplete()
                    ? ScheduledTaskType.NEXT_TRICK_START_TASK
                    : ScheduledTaskType.CARD_THROW_TIMEOUT_TASK;
            case FINISHED -> ScheduledTaskType.ROUND_START_TASK;
            default -> null;
        };
    }

    // Builds a snapshot for the perspective user, including the active timer's type + remaining seconds,
    // so the client resumes the countdown in sync with the server's scheduled timeout.
    private GameSnapshotEvent buildSnapshot(BeloteGame game, String userId) {
        ScheduledTaskType timerType = activeTimerType(game.getCurrentRound());
        Long remainingSeconds = timerType == null
                ? null
                : scheduledTaskRegistry.getRemainingSeconds(game.getId(), timerType);
        // Only advertise the timer type when its task is actually scheduled (remaining is non-null).
        String timerTypeName = remainingSeconds == null ? null : timerType.name();

        return new GameSnapshotEvent(game, userId, timerTypeName, remainingSeconds);
    }

    private void broadcastToGame(BeloteGame game, OutgoingEvent event) {
        game.getPlayers().forEach(player -> {
            if (player.isBot()) return;

            webSocketPublisher.sendToActiveSession(player.getUserId(), event);
        });
    }

    public void broadcastPerspectiveUpdate(BeloteGame game, PerspectiveOutgoingEvent event) {
        for (GamePlayer player : game.getPlayers()) {
            if (player.isBot()) continue;

            webSocketPublisher.sendToActiveSession(
                    player.getUserId(),
                    buildSnapshot(game, player.getUserId())
            );
        }
    }

    public void sendSnapshot(BeloteGame game, String userId) {
        webSocketPublisher.sendToActiveSession(
                userId,
                buildSnapshot(game, userId)
        );
    }

    public void broadcastSnapshot(BeloteGame game) {
        for (GamePlayer player : game.getPlayers()) {
            if (player.isBot()) continue;

            sendSnapshot(game, player.getUserId());
        }
    }

    public void roundStarted(BeloteGame game) {
        BeloteRound round = game.getCurrentRound();

        for (GamePlayer player : game.getPlayers()) {
            if (player.isBot()) continue;
            
            List<Card> visibleHand = player.getHand().stream()
                    .filter(card -> !card.isHidden())
                    .toList();
            visibleHand = CardOrdering.sortForClient(visibleHand);

            webSocketPublisher.sendToActiveSession(
                    player.getUserId(),
                    new RoundStartEvent(
                            round.getRoundNumber(),
                            round.getRoundStatus(),
                            round.getCurrentTurnIndex(),
                            visibleHand,
                            round.getTeam1RoundScore(),
                            round.getTeam2RoundScore()
                    )
            );
        }
    }

    public void trumpChoosingStarted(BeloteGame game, long timeoutSeconds) {
        BeloteRound round = game.getCurrentRound();

        broadcastToGame(
                game,
                new TrumpChoosingStartedEvent(
                        round.getRoundNumber(),
                        round.getCurrentTurnIndex(),
                        timeoutSeconds
                )
        );
    }

    public void trumpChoiceSkipped(BeloteGame game, int skippedTurnIndex, long timeoutSeconds) {
        BeloteRound round = game.getCurrentRound();

        broadcastToGame(
                game,
                new TrumpChoiceSkippedEvent(
                        round.getRoundNumber(),
                        skippedTurnIndex,
                        round.getCurrentTurnIndex(),
                        timeoutSeconds
                )
        );
    }

    public void trumpChosen(
            BeloteGame game,
            int chosenByTurnIndex,
            Suite trumpSuite,
            RoundStatus roundStatus,
            Map<String, List<Card>> revealedCardsByUserId
    ) {
        BeloteRound round = game.getCurrentRound();

        for (GamePlayer player : game.getPlayers()) {
            if (player.isBot()) continue;

            webSocketPublisher.sendToActiveSession(
                    player.getUserId(),
                    new TrumpChosenEvent(
                            player.getUserId(),
                            round.getRoundNumber(),
                            chosenByTurnIndex,
                            round.getCurrentTurnIndex(),
                            trumpSuite,
                            roundStatus,
                            CardOrdering.sortForClient(player.getHand()),
                            CardOrdering.sortForClient(revealedCardsByUserId.getOrDefault(player.getUserId(), List.of())),
                            round.getTeam1RoundScore(),
                            round.getTeam2RoundScore(),
                            game.getTeam1().getTotalScore(),
                            game.getTeam2().getTotalScore(),
                            round.getRoundTeam(0).getDeclarations(),
                            round.getRoundTeam(1).getDeclarations()
                    )
            );
        }
    }

    public void cardTurnStarted(BeloteGame game, long timeoutSeconds) {
        BeloteRound round = game.getCurrentRound();

        broadcastToGame(
                game,
                new CardTurnStartedEvent(
                        round.getRoundNumber(),
                        round.getCurrentTrickNumber(),
                        round.getCurrentTurnIndex(),
                        timeoutSeconds
                )
        );
    }

    public void cardThrown(
            BeloteGame game,
            int roundNumber,
            int trickNumber,
            int playerIndex,
            Card card,
            boolean expired,
            boolean trickComplete,
            boolean nextTrickPending,
            Integer winningPlayerIndex,
            long timeoutSeconds,
            long pendingDelaySeconds,
            boolean bela
    ) {
        broadcastToGame(
                game,
                new CardThrownEvent(
                        roundNumber,
                        trickNumber,
                        playerIndex,
                        card,
                        expired,
                        trickComplete,
                        nextTrickPending,
                        winningPlayerIndex,
                        game.getCurrentRound().getCurrentTurnIndex(),
                        timeoutSeconds,
                        pendingDelaySeconds,
                        game.getCurrentRound().getTeam1RoundScore(),
                        game.getCurrentRound().getTeam2RoundScore(),
                        game.getTeam1().getTotalScore(),
                        game.getTeam2().getTotalScore(),
                        bela
                )
        );
    }

    public void statusChanged(BeloteGame game) {
        broadcastToGame(game, new GameStatusChangedEvent(game.getStatus()));
    }

    public void gameEnded(BeloteGame game) {
        broadcastToGame(
                game,
                new GameEndedEvent(
                        game.getTeam1().getTotalScore(),
                        game.getTeam2().getTotalScore(),
                        game.getWinningTeamIndex(),
                        game.getStatus()
                )
        );
    }

}
