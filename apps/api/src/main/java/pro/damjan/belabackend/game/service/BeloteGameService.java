package pro.damjan.belabackend.game.service;

import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import pro.damjan.belabackend.game.events.GameAbandonedEvent;
import pro.damjan.belabackend.game.events.PlayerLeftGameEvent;
import pro.damjan.belabackend.game.model.BeloteGame;
import pro.damjan.belabackend.game.model.GameStatus;
import pro.damjan.belabackend.game.model.config.GameConfiguration;
import pro.damjan.belabackend.game.model.player.GamePlayer;
import pro.damjan.belabackend.game.model.card.Rank;
import pro.damjan.belabackend.game.model.card.Suite;
import pro.damjan.belabackend.game.exception.GameNotFoundException;
import pro.damjan.belabackend.game.service.access.GameAccessService;
import pro.damjan.belabackend.game.service.lifecycle.GameLifecycleService;
import pro.damjan.belabackend.game.service.lock.GameLockService;
import pro.damjan.belabackend.game.service.play.CardPlayService;
import pro.damjan.belabackend.game.service.play.TrumpPhaseService;
import pro.damjan.belabackend.lobby.model.Lobby;
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
    private final ApplicationEventPublisher applicationEventPublisher;

    public BeloteGame createGame(Lobby lobby) {
        return gameLifecycleService.createGame(lobby);
    }

    /** Creates a game from an explicit seating, for a table matched out of several lobbies. */
    public BeloteGame createGame(List<GamePlayer> players, GameConfiguration config) {
        return gameLifecycleService.createGame(players, config);
    }

    public BeloteGame findGameById(String gameId) {
        return gameAccessService.findGameById(gameId);
    }

    /**
     * Records that a player's game screen is up, or gets them off it if the game is gone.
     *
     * Refusing here used to trap people. A player whose game was dropped while they were away —
     * they closed the tab rather than leaving, so nothing ever reset their lobby — still has a
     * lobby saying IN_GAME with the dead game's id. Reconnecting sends them to that game, this
     * command answered with "game not found", the screen gave up and went home, and home read the
     * same lobby and sent them back. Nothing in that circle cleared the id that caused it.
     *
     * So a missing game is announced as a leave instead, which is the path that already exists for
     * exactly this: the lobby resets itself and the snapshot it sends puts the player back at
     * their table. Safe when the id is already gone too, and it only ever runs when there is no
     * game to load, so the ordinary handshake is untouched.
     */
    public void onLoaded(String userId) {
        String gameId = gameAccessService.getUserGameId(userId);

        if (gameId == null || gameAccessService.findGameById(gameId) == null) {
            leaveGame(userId);
            return;
        }

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

    public void handleDeclarationAskTimeout(String gameId, int roundNumber) {
        gameLockService.withGameLock(gameId, () -> trumpPhaseService.handleDeclarationAskTimeout(gameId, roundNumber));
    }

    public void handleDeclarationsComplete(String gameId, int roundNumber) {
        gameLockService.withGameLock(gameId, () -> trumpPhaseService.handleDeclarationsComplete(gameId, roundNumber));
    }

    public void chooseTrump(String userId, Suite suite) {
        withUserGameLock(userId, () -> trumpPhaseService.chooseTrump(userId, suite));
    }

    public void passTrump(String userId) {
        withUserGameLock(userId, () -> trumpPhaseService.passTrump(userId));
    }

    public void answerDeclarations(String userId, boolean declare) {
        withUserGameLock(userId, () -> trumpPhaseService.answerDeclarations(userId, declare));
    }

    public void throwCard(String userId, Suite suite, Rank rank, boolean declareBela) {
        withUserGameLock(userId, () -> cardPlayService.throwCard(userId, suite, rank, declareBela));
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

    /**
     * Takes a player out of the game they are in, which means two different things.
     *
     * A finished game is the ordinary way out: the player steps off the scoreboard, the lobby takes
     * them back, and the game is dropped once the last of them has gone. A game still in progress is
     * an abandonment, and it ends the game for everyone — which is not a policy invented here, it is
     * what {@code LobbyEvictionService} already does the moment any player goes stale for thirty
     * seconds. Doing it on purpose only makes it immediate, and lets the leaver be told what it costs
     * before they commit.
     *
     * The announcement is made outside the game lock — the listener does its own Redis work on the
     * lobby and has no business holding a game lock while it does. A player with no game left (they
     * already left, or the last leaver dropped it) still gets announced: that is the path that
     * recovers a client stuck on a game that is gone.
     */
    public void leaveGame(String userId) {
        String gameId = gameAccessService.getUserGameId(userId);
        BeloteGame game = gameId == null ? null : gameAccessService.findGameById(gameId);

        if (game != null && game.getStatus() != GameStatus.FINISHED) {
            // Read before the drop. `dropGame` deletes the game, so the seating is gone by the time
            // the listener runs and would have nobody left to hand back to their lobby.
            List<String> humanUserIds = game.getPlayers().stream()
                    .filter(player -> !player.isBot())
                    .map(GamePlayer::getUserId)
                    .toList();

            gameLockService.withGameLock(gameId, () -> gameLifecycleService.dropGame(gameId));
            applicationEventPublisher.publishEvent(new GameAbandonedEvent(userId, humanUserIds));
            return;
        }

        if (gameId != null) {
            gameLockService.withGameLock(gameId, () -> gameLifecycleService.leaveFinishedGame(userId, gameId));
        }

        applicationEventPublisher.publishEvent(new PlayerLeftGameEvent(userId));
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
