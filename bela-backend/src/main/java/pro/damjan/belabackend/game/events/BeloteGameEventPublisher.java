package pro.damjan.belabackend.game.events;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import pro.damjan.belabackend.game.events.dto.outgoing.BeloteGameSnapshotEvent;
import pro.damjan.belabackend.game.model.BeloteGame;
import pro.damjan.belabackend.websocket.events.WebSocketPublisher;

@Service
@RequiredArgsConstructor
public class BeloteGameEventPublisher {

    private final WebSocketPublisher webSocketPublisher;

    public void sendSnapshot(BeloteGame game, String userId) {
        webSocketPublisher.sendToActiveSession(
                userId,
                new BeloteGameSnapshotEvent(game)
        );
    }

}
