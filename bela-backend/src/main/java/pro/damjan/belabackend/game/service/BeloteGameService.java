package pro.damjan.belabackend.game.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import pro.damjan.belabackend.game.model.BeloteGame;
import pro.damjan.belabackend.game.model.card.Rank;
import pro.damjan.belabackend.game.model.card.Suite;
import pro.damjan.belabackend.game.exception.GameNotFoundException;
import pro.damjan.belabackend.game.service.access.GameAccessService;
import pro.damjan.belabackend.game.service.lifecycle.GameLifecycleService;
import pro.damjan.belabackend.game.service.lock.GameLockService;
import pro.damjan.belabackend.game.service.play.CardPlayService;
import pro.damjan.belabackend.game.service.play.TrumpPhaseService;
import pro.damjan.belabackend.lobby.model.LobbyPlayer;

import java.util.List;

@Service
@RequiredArgsConstructor
public class BeloteGameService {

    private final GameAccessService gameAccessService;
    private final GameLifecycleService gameLifecycleService;
    private final TrumpPhaseService trumpPhaseService;
    private final CardPlayService cardPlayService;
    private final GameLockService gameLockService;

    public BeloteGame createGame(List<LobbyPlayer> lobbyPlayers) {
        return gameLifecycleService.createGame(lobbyPlayers);
    }

    public BeloteGame findGameById(String gameId) {
        return gameAccessService.findGameById(gameId);
    }

    public void onLoaded(String userId) {
        withUserGameLock(userId, () -> gameLifecycleService.onLoaded(userId));
    }

    public void startRound(String gameId) {
        gameLockService.withGameLock(gameId, () -> gameLifecycleService.startRound(gameId));
    }

    public void startRound(String gameId, Integer expectedRoundNumber) {
        gameLockService.withGameLock(gameId, () -> gameLifecycleService.startRound(gameId, expectedRoundNumber));
    }

    public void handleChoosingTrumpTimeout(String gameId, int roundNumber, int turnIndex) {
        gameLockService.withGameLock(gameId, () -> trumpPhaseService.handleChoosingTrumpTimeout(gameId, roundNumber, turnIndex));
    }

    public void handleBotTrumpChoice(String gameId, int roundNumber, int turnIndex) {
        gameLockService.withGameLock(gameId, () -> trumpPhaseService.handleBotTrumpChoice(gameId, roundNumber, turnIndex));
    }

    public void chooseTrump(String userId, Suite suite) {
        withUserGameLock(userId, () -> trumpPhaseService.chooseTrump(userId, suite));
    }

    public void passTrump(String userId) {
        withUserGameLock(userId, () -> trumpPhaseService.passTrump(userId));
    }

    public void throwCard(String userId, Suite suite, Rank rank) {
        withUserGameLock(userId, () -> cardPlayService.throwCard(userId, suite, rank));
    }

    public void handleCardThrowTimeout(String gameId, int roundNumber, int trickNumber, int turnIndex) {
        gameLockService.withGameLock(gameId, () -> cardPlayService.handleCardThrowTimeout(gameId, roundNumber, trickNumber, turnIndex));
    }

    public void handleNextTrickStart(String gameId, int roundNumber, int completedTrickNumber, int winningTurnIndex) {
        gameLockService.withGameLock(
                gameId,
                () -> cardPlayService.handleNextTrickStart(gameId, roundNumber, completedTrickNumber, winningTurnIndex)
        );
    }

    public void dropGame(String gameId) {
        gameLockService.withGameLock(gameId, () -> gameLifecycleService.dropGame(gameId));
    }

    private void withUserGameLock(String userId, Runnable action) {
        String gameId = gameAccessService.getUserGameId(userId);
        if (gameId == null) {
            throw new GameNotFoundException();
        }

        gameLockService.withGameLock(gameId, action);
    }
}
