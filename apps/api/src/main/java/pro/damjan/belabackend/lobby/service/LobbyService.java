package pro.damjan.belabackend.lobby.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import pro.damjan.belabackend.game.model.BeloteGame;
import pro.damjan.belabackend.game.model.config.GameConfiguration;
import pro.damjan.belabackend.game.model.config.MatchType;
import pro.damjan.belabackend.game.service.BeloteGameService;
import pro.damjan.belabackend.lobby.exception.AlreadyInLobbyException;
import pro.damjan.belabackend.lobby.exception.LobbyFullException;
import pro.damjan.belabackend.lobby.exception.LobbyNotFoundException;
import pro.damjan.belabackend.lobby.exception.LobbyNotJoinableException;
import pro.damjan.belabackend.lobby.exception.PlayerNotHostException;
import pro.damjan.belabackend.lobby.exception.PlayerNotInLobbyException;
import pro.damjan.belabackend.lobby.model.LobbyStatus;
import pro.damjan.belabackend.lobby.repository.LobbyRepository;
import pro.damjan.belabackend.lobby.model.Lobby;
import pro.damjan.belabackend.lobby.model.LobbyPlayer;
import pro.damjan.belabackend.lobby.model.LobbyPlayerStatus;
import pro.damjan.belabackend.lobby.events.LobbyEventPublisher;
import pro.damjan.belabackend.user.UserRepository;
import pro.damjan.belabackend.user.UserService;
import pro.damjan.belabackend.user.presence.UserPresence;
import pro.damjan.belabackend.user.presence.UserPresenceService;
import pro.damjan.belabackend.user.presence.session.SessionService;
import pro.damjan.belabackend.user.presence.session.exception.SessionLockException;

import pro.damjan.belabackend.user.User;
import pro.damjan.belabackend.user.auth.Role;

import java.security.SecureRandom;
import java.util.Map;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class LobbyService {

    private static final String INVITE_CODE_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    private static final int INVITE_CODE_LENGTH = 6;
    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    private final LobbyRepository lobbyRepository;
    private final UserPresenceService userPresenceService;
    private final LobbyEventPublisher lobbyEventPublisher;
    private final SessionService sessionService;
    private final BeloteGameService beloteGameService;
    private final UserService userService;

    /**
     * A seated player, with their identity copied onto the seat.
     *
     * Snapshotted rather than joined at publish time: lobby events fire on every
     * ready toggle and seat swap, and a four-row lookup on each of those buys
     * only a freshness nobody asked for.
     */
    private LobbyPlayer createPlayer(String userId, boolean isHost) {
        LobbyPlayer player = new LobbyPlayer(userId, isHost, LobbyPlayerStatus.NOT_READY);

        User user = userService.getUserById(userId);
        if (user != null) {
            player.setUsername(user.getUsername());
            player.setAvatarUrl(user.getAvatarUrl());
        }

        return player;
    }

    private String generateLobbyId() {
        String id;

        do {
            id = UUID.randomUUID().toString();
        } while (lobbyRepository.existsById(id));

        return id;
    }

    private String generateInviteCode() {
        String code;
        do {
            StringBuilder sb = new StringBuilder(INVITE_CODE_LENGTH);
            for (int i = 0; i < INVITE_CODE_LENGTH; i++) {
                sb.append(INVITE_CODE_CHARS.charAt(SECURE_RANDOM.nextInt(INVITE_CODE_CHARS.length())));
            }
            code = sb.toString();
        } while (lobbyRepository.existsByInviteCode(code));
        return code;
    }

    private String getUserLobbyId(String userId) {
        UserPresence presence = userPresenceService.getUserPresence(userId);
        return presence != null ? presence.getLobbyId() : null;
    }

    private Lobby getUserLobby(String userId)  {
        String lobbyId = getUserLobbyId(userId);
        if (lobbyId == null) {
            return null;
        }
        return lobbyRepository.findById(lobbyId).orElse(null);
    }

    public Lobby createLobby(String creatorId, String sessionId) {
        if (sessionService.userHasActiveSession(creatorId)) {
            throw new SessionLockException();
        }

        if (getUserLobby(creatorId) != null) {
            throw new AlreadyInLobbyException();
        }

        Lobby lobby = new Lobby();
        lobby.setId(generateLobbyId());
        lobby.setInviteCode(generateInviteCode());
        lobby.setGameConfiguration(GameConfiguration.privateGame(501));

        // Get empty player list and set the first player as the creator
        Map<Integer, LobbyPlayer> players = lobby.getPlayerSeats();

        // 1st player is the creator, set to not ready. Others are null.
        // No need to call lobby.setPlayers because this is a reference.
        lobby.addPlayer(createPlayer(creatorId, true));

        lobbyRepository.save(lobby);
        userPresenceService.setUserLobby(creatorId, lobby.getId());

        // Lock the session
        sessionService.lockSession(sessionId);

        // Emit lobby joined event to player
        lobbyEventPublisher.sendSnapshot(lobby, creatorId);

        return lobby;
    }

    protected void joinLobby(String userId, String sessionId, Lobby lobby)
            throws AlreadyInLobbyException, LobbyFullException, SessionLockException {

        if (lobby.isPlayerInLobby(userId)) {
            throw new AlreadyInLobbyException();
        }

        if (sessionService.userHasActiveSession(userId)) {
            throw new SessionLockException();
        }

        // If the user is already in a lobby
        if (getUserLobby(userId) != null) {
            throw new AlreadyInLobbyException();
        }

        if (lobby.isFull()) {
            throw new LobbyFullException();
        }

        if (!lobby.isJoinable()) {
            throw new LobbyNotJoinableException();
        }

        LobbyPlayer newPlayer = createPlayer(userId, false);

        lobby.addPlayer(newPlayer);

        lobbyRepository.save(lobby);

        sessionService.lockSession(sessionId);
        userPresenceService.setUserLobby(userId, lobby.getId());

        lobbyEventPublisher.playerJoined(lobby, newPlayer);
    }

    public void evictPlayer(String userId, Lobby lobby) {
        if (!lobby.isPlayerInLobby(userId)) {
            return;
        }

        lobby.removePlayer(userId);
        lobbyRepository.save(lobby);
        userPresenceService.cleanUpUser(userId);

        lobbyEventPublisher.playerLeft(lobby, userId);
    }

    public void leaveLobby(String userId) {
        Lobby lobby = getUserLobby(userId);

        if (lobby == null) {
            userPresenceService.cleanUpUser(userId);
            return;
        }

        Lobby.RemoveResult removeResult = lobby.removePlayer(userId);
        int remainingPlayers = lobby.getPlayerCount();

        userPresenceService.cleanUpUser(userId);

        // Persistence and tasks
        if (remainingPlayers == 0) {
            lobbyRepository.delete(lobby);
            log.info("Lobby {} deleted because the last player left", lobby.getId());
        } else {
            if (removeResult == Lobby.RemoveResult.NOT_FOUND) {
                log.warn("Player {} was not found in lobby {} when trying to leave", userId, lobby.getId());
                return;
            }

            lobbyRepository.save(lobby);
            lobbyEventPublisher.playerLeft(lobby, userId);

            if (removeResult == Lobby.RemoveResult.REMOVED_AND_HOST_CHANGED) {
                LobbyPlayer host = lobby.getHost().orElse(null);
                if (host == null) {
                    // This should never happen because if there are remaining players there should be a host
                    throw new IllegalStateException("Lobby has players but no host");
                }
                lobbyEventPublisher.lobbyHostChanged(lobby, host.getUserId());
            }
        }
    }

    public void joinLobbyViaCode(String userId, String sessionId, String code)
            throws LobbyNotFoundException, AlreadyInLobbyException, LobbyFullException, SessionLockException {
        Lobby lobby = lobbyRepository.findByInviteCode(code).orElseThrow(LobbyNotFoundException::new);

        joinLobby(userId, sessionId, lobby);
    }

    public void createGame(Lobby lobby) {
        BeloteGame game = beloteGameService.createGame(lobby);

        lobby.setGameId(game.getId());
        lobby.setStatus(LobbyStatus.IN_GAME);
        lobby.setJoinable(false);
        lobbyRepository.save(lobby);

        for (LobbyPlayer player : lobby.getPlayersAsList()) {
            if (!player.isBot()) userPresenceService.setUserGame(player.getUserId(), game.getId());
        }

        lobbyEventPublisher.gameCreated(lobby, game);
    }

    public void onPlayerReady(String userId, boolean ready) throws LobbyNotFoundException {
        Lobby lobby = getUserLobby(userId);

        if (lobby == null) {
            throw new LobbyNotFoundException();
        }

        if (lobby.getGameId() != null) {
            throw new IllegalStateException("Player in lobby " + lobby.getId() + " tried to change ready status but game has already started");
        }

        LobbyPlayer player = lobby.findPlayerById(userId).orElseThrow(LobbyNotFoundException::new);
        player.setStatus(ready ? LobbyPlayerStatus.READY : LobbyPlayerStatus.NOT_READY);

        lobbyRepository.save(lobby);
        lobbyEventPublisher.playerStatusChanged(lobby, player);

        if (!lobby.allPlayersReady()) return;

        // everyone is ready and the lobby is full => start the game
        if (lobby.isFull()) {
            createGame(lobby);
            return;
        }

        if (lobby.getGameConfiguration().matchType() == MatchType.PRIVATE) {
            startWithBots(lobby);
            return;
        }
    }

    public void swapSeats(String userId, int targetSeat) throws LobbyNotFoundException {
        Lobby lobby = getUserLobby(userId);

        if (lobby == null) {
            throw new LobbyNotFoundException();
        }

        lobby.swapSeats(userId, targetSeat);
        lobbyRepository.save(lobby);

        lobbyEventPublisher.seatsUpdated(lobby);
    }

    public void updateConfig(String userId, GameConfiguration configuration) {
        Lobby lobby = getUserLobby(userId);

        if (lobby == null) {
            throw new LobbyNotFoundException();
        }

        LobbyPlayer lobbyPlayer = lobby.findPlayerById(userId)
                .orElseThrow(PlayerNotInLobbyException::new);
        if (!lobbyPlayer.isHost()) {
            throw new PlayerNotHostException();
        }

        lobby.setGameConfiguration(configuration);

        lobbyRepository.save(lobby);

        lobbyEventPublisher.configChanged(lobby);
    }

    public void startWithBots(Lobby lobby) {
        if (lobby.getGameId() != null) {
            throw new IllegalStateException("Game already started");
        }

        if (lobby.getGameConfiguration().matchType() != MatchType.PRIVATE) {
            throw new IllegalStateException("Can't have bots in a non-private match");
        }

        // Fill empty seats with bots. Naming happens after addPlayer because the
        // seat, which the name is derived from, is only assigned in there.
        while (!lobby.isFull()) {
            LobbyPlayer bot = LobbyPlayer.createBot();
            lobby.addPlayer(bot);
            bot.setUsername(LobbyPlayer.botNameForSeat(bot.getSeat()));
        }

        lobbyRepository.save(lobby);
        lobbyEventPublisher.seatsUpdated(lobby); // notify clients of new seat state

        createGame(lobby);
    }

}
