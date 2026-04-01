package pro.damjan.belabackend.game.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import pro.damjan.belabackend.user.presence.UserPresence;
import pro.damjan.belabackend.user.presence.UserPresenceService;
import pro.damjan.belabackend.user.presence.events.UserReconnectedEvent;

@Slf4j
@Service
@RequiredArgsConstructor
public class GameReconnectService {

    private final UserPresenceService userPresenceService;

    public void handleReconnect(UserReconnectedEvent event, UserPresence userPresence, String gameId) {
        if (!userPresence.getGameId().equals(gameId)) {
            log.warn("Game ID mismatch for user {}: expected {}, actual {}", event.userId(), userPresence.getGameId(), gameId);
            userPresenceService.setUserGame(
                    event.userId(),
                    gameId
            );
        }


    }
}
