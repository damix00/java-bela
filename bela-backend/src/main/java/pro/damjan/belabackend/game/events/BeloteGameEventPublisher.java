package pro.damjan.belabackend.game.events;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import pro.damjan.belabackend.game.events.dto.outgoing.GameSnapshotEvent;
import pro.damjan.belabackend.game.events.dto.outgoing.GameStatusUpdateEvent;
import pro.damjan.belabackend.game.model.BeloteGame;
import pro.damjan.belabackend.websocket.events.WebSocketPublisher;
import pro.damjan.belabackend.websocket.events.dto.OutgoingEvent;

@Service
@RequiredArgsConstructor
public class BeloteGameEventPublisher {

    private final WebSocketPublisher webSocketPublisher;

    private void broadcastToGame(BeloteGame game, OutgoingEvent event) {
        game.getPlayers().forEach(player -> {
            webSocketPublisher.sendToActiveSession(player.getUserId(), event);
        });
    }

    public void sendSnapshot(BeloteGame game, String userId) {
        webSocketPublisher.sendToActiveSession(
                userId,
                new GameSnapshotEvent(game)
        );
    }

    // Shouldn't be used too often, as it sends the entire game state to all players.
    // Useful for synchronizing more complex game state changes, or for debugging purposes.
    public void broadcastSnapshot(BeloteGame game) {
        broadcastToGame(game, new GameSnapshotEvent(game));
    }

    /**
     * Sends the whole game state to all players, since status updates affect many aspects of the game
     * @param game The game object containing the updated status. The entire game state will be sent to all players, so make sure to update the game object accordingly before calling this method.
     */
    public void gameStatusUpdated(BeloteGame game) {
        broadcastToGame(game, new GameStatusUpdateEvent(game));
    }

}
