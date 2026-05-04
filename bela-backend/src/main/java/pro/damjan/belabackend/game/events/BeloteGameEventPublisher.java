package pro.damjan.belabackend.game.events;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import pro.damjan.belabackend.game.events.dto.outgoing.GameSnapshotEvent;
import pro.damjan.belabackend.game.events.dto.outgoing.GameStatusChangedEvent;
import pro.damjan.belabackend.game.events.dto.outgoing.PerspectiveOutgoingEvent;
import pro.damjan.belabackend.game.events.dto.outgoing.RoundStartEvent;
import pro.damjan.belabackend.game.events.dto.outgoing.TrumpChoiceSkippedEvent;
import pro.damjan.belabackend.game.events.dto.outgoing.TrumpChosenEvent;
import pro.damjan.belabackend.game.events.dto.outgoing.TrumpChoosingStartedEvent;
import pro.damjan.belabackend.game.model.BeloteGame;
import pro.damjan.belabackend.game.model.card.Card;
import pro.damjan.belabackend.game.model.card.Suite;
import pro.damjan.belabackend.game.model.player.GamePlayer;
import pro.damjan.belabackend.game.model.round.BeloteRound;
import pro.damjan.belabackend.game.model.round.RoundStatus;
import pro.damjan.belabackend.websocket.events.WebSocketPublisher;
import pro.damjan.belabackend.websocket.events.dto.OutgoingEvent;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class BeloteGameEventPublisher {

    private final WebSocketPublisher webSocketPublisher;

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
                    new GameSnapshotEvent(game, player.getUserId())
            );
        }
    }

    public void sendSnapshot(BeloteGame game, String userId) {
        webSocketPublisher.sendToActiveSession(
                userId,
                new GameSnapshotEvent(game, userId)
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

            webSocketPublisher.sendToActiveSession(
                    player.getUserId(),
                    new RoundStartEvent(
                            round.getRoundNumber(),
                            round.getRoundStatus(),
                            round.getCurrentTurnIndex(),
                            visibleHand
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
                            trumpSuite,
                            roundStatus,
                            revealedCardsByUserId.getOrDefault(player.getUserId(), List.of())
                    )
            );
        }
    }

    public void statusChanged(BeloteGame game) {
        broadcastToGame(game, new GameStatusChangedEvent(game.getStatus()));
    }

}
