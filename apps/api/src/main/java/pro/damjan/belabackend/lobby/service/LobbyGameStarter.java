package pro.damjan.belabackend.lobby.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import pro.damjan.belabackend.game.model.BeloteGame;
import pro.damjan.belabackend.game.service.BeloteGameService;
import pro.damjan.belabackend.lobby.events.LobbyEventPublisher;
import pro.damjan.belabackend.lobby.model.Lobby;
import pro.damjan.belabackend.lobby.model.LobbyPlayer;
import pro.damjan.belabackend.lobby.model.LobbyStatus;
import pro.damjan.belabackend.lobby.repository.LobbyRepository;
import pro.damjan.belabackend.user.presence.UserPresenceService;

/**
 * Sends a lobby into a game.
 *
 * Extracted from {@link LobbyService} because a matched table needs the same work done to two,
 * three or four lobbies at once, and the service that seats them cannot depend on
 * {@code LobbyService} without closing a cycle back through matchmaking. Both callers share this
 * instead.
 */
@Service
@RequiredArgsConstructor
public class LobbyGameStarter {

    private final LobbyRepository lobbyRepository;
    private final UserPresenceService userPresenceService;
    private final LobbyEventPublisher lobbyEventPublisher;
    private final BeloteGameService beloteGameService;

    /** Creates a game from a lobby's own seats and points the lobby at it. */
    public BeloteGame startFrom(Lobby lobby) {
        BeloteGame game = beloteGameService.createGame(lobby);
        attachToGame(lobby, game);
        return game;
    }

    /**
     * Points a lobby at a game and tells everyone in it to go.
     *
     * Called once per lobby at a matched table, all with the same game, so each of them tracks it
     * and a reconnecting player is routed back into the game rather than to an idle table.
     *
     * A matched lobby is not full — a solo queuer's lobby holds one player — so empty seats are
     * skipped here where {@link Lobby#getPlayersAsList} pads them with nulls.
     */
    public void attachToGame(Lobby lobby, BeloteGame game) {
        lobby.setGameId(game.getId());
        lobby.setStatus(LobbyStatus.IN_GAME);
        lobby.setJoinable(false);
        lobbyRepository.save(lobby);

        for (LobbyPlayer player : lobby.getPlayersAsList()) {
            if (player == null || player.isBot()) continue;

            userPresenceService.setUserGame(player.getUserId(), game.getId());
        }

        lobbyEventPublisher.gameCreated(lobby, game);
    }
}
