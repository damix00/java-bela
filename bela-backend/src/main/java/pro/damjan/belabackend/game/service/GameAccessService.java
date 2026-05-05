package pro.damjan.belabackend.game.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import pro.damjan.belabackend.game.exception.GameNotFoundException;
import pro.damjan.belabackend.game.model.BeloteGame;
import pro.damjan.belabackend.game.repository.BeloteGameRepository;
import pro.damjan.belabackend.user.presence.UserPresence;
import pro.damjan.belabackend.user.presence.UserPresenceService;

@Service
@RequiredArgsConstructor
public class GameAccessService {

    private final BeloteGameRepository beloteGameRepository;
    private final UserPresenceService userPresenceService;

    public String getUserGameId(String userId) {
        UserPresence userPresence = userPresenceService.getUserPresence(userId);

        if (userPresence == null) {
            return null;
        }

        return userPresence.getGameId();
    }

    public BeloteGame findGameById(String gameId) {
        return beloteGameRepository.findById(gameId).orElse(null);
    }

    public BeloteGame requireGameById(String gameId) {
        BeloteGame game = findGameById(gameId);

        if (game == null) {
            throw new GameNotFoundException();
        }

        return game;
    }

    public BeloteGame requireUserGame(String userId) {
        String gameId = getUserGameId(userId);

        if (gameId == null) {
            throw new GameNotFoundException();
        }

        return requireGameById(gameId);
    }

    public BeloteGame save(BeloteGame game) {
        return beloteGameRepository.save(game);
    }

    public void delete(BeloteGame game) {
        beloteGameRepository.delete(game);
    }
}
