package pro.damjan.belabackend.lobby;

import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;
import pro.damjan.belabackend.lobby.exception.AlreadyInLobbyException;
import pro.damjan.belabackend.lobby.exception.LobbyFullException;
import pro.damjan.belabackend.lobby.exception.LobbyNotFoundException;
import pro.damjan.belabackend.lobby.model.Lobby;
import pro.damjan.belabackend.lobby.model.LobbyPlayer;
import pro.damjan.belabackend.lobby.model.LobbyPlayerStatus;
import pro.damjan.belabackend.lobby.events.LobbyEventPublisher;
import pro.damjan.belabackend.user.presence.PresenceService;
import pro.damjan.belabackend.user.presence.session.SessionService;
import pro.damjan.belabackend.user.presence.session.exception.SessionLockException;

import java.security.SecureRandom;
import java.util.UUID;

@Service
public class LobbyService {

    private static final String INVITE_CODE_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    private static final int INVITE_CODE_LENGTH = 6;
    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    private final LobbyRepository lobbyRepository;
    private final PresenceService userPresence;
    private final LobbyEventPublisher lobbyEventPublisher;
    private final SessionService sessionService;

    public LobbyService(LobbyRepository lobbyRepository, PresenceService userPresence, LobbyEventPublisher lobbyEventPublisher, SessionService sessionService) {
        this.lobbyRepository = lobbyRepository;
        this.userPresence = userPresence;
        this.lobbyEventPublisher = lobbyEventPublisher;
        this.sessionService = sessionService;
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

    public Lobby createLobby(String creatorId, String sessionId) {
        if (sessionService.userHasActiveSession(creatorId)) {
            throw new SessionLockException();
        }

        if (userPresence.getUserPresence(creatorId).getLobbyId() != null) {
            throw new AlreadyInLobbyException();
        }

        Lobby lobby = new Lobby();
        lobby.setId(generateLobbyId());
        lobby.setInviteCode(generateInviteCode());

        // Get empty player list and set the first player as the creator
        LobbyPlayer[] players = lobby.getPlayers();

        // 1st player is the creator, set to not ready. Others are null.
        // No need to call lobby.setPlayers because this is a reference.
        players[0] = new LobbyPlayer(creatorId, true, LobbyPlayerStatus.NOT_READY);

        lobbyRepository.save(lobby);
        userPresence.setUserLobby(creatorId, lobby.getId());

        // Lock the session
        sessionService.lockSession(sessionId);

        // Emit lobby joined event to player
        lobbyEventPublisher.sendSnapshot(lobby, creatorId);

        return lobby;
    }

    @Transactional
    protected void joinLobby(String userId, String sessionId, Lobby lobby)
            throws AlreadyInLobbyException, LobbyFullException, SessionLockException {

        if (lobby.isPlayerInLobby(userId)) {
            throw new AlreadyInLobbyException();
        }

        if (sessionService.userHasActiveSession(userId)) {
            throw new SessionLockException();
        }

        // If the user is already in a lobby
        if (userPresence.getUserPresence(userId).getLobbyId() != null) {
            throw new AlreadyInLobbyException();
        }

        LobbyPlayer newPlayer = new LobbyPlayer(
                userId,
                false,
                LobbyPlayerStatus.NOT_READY
        );

        lobby.addPlayer(newPlayer);

        lobbyRepository.save(lobby);

        sessionService.lockSession(sessionId);
        userPresence.setUserLobby(userId, lobby.getId());

        lobbyEventPublisher.playerJoined(lobby, newPlayer);

        throw new LobbyFullException();
    }

    private void cleanUpUserPresence(String userId) {
        userPresence.setUserLobby(userId, null);
        sessionService.unlockUserSessions(userId);
    }

    @Transactional
    public void leaveLobby(String userId) {
        String lobbyId = userPresence.getUserPresence(userId).getLobbyId();
        if (lobbyId == null) return;

        Lobby lobby = lobbyRepository.findById(lobbyId).orElse(null);
        if (lobby == null) {
            cleanUpUserPresence(userId);
            return;
        }

        boolean hostChanged = lobby.removePlayer(userId);
        int remainingPlayers = lobby.getLobbyPlayerCount();

        cleanUpUserPresence(userId);

        // Persistence and events
        if (remainingPlayers == 0) {
            lobbyRepository.delete(lobby);
        } else {
            lobbyRepository.save(lobby);

            if (hostChanged) {
                lobbyEventPublisher.lobbyHostChanged(lobby, lobby.getHost().getUserId());
            }

            lobbyEventPublisher.playerLeft(lobby, userId);
        }
    }

    public void joinLobbyViaCode(String userId, String sessionId, String code)
            throws LobbyNotFoundException, AlreadyInLobbyException, LobbyFullException, SessionLockException {
        Lobby lobby = lobbyRepository.findByInviteCode(code).orElseThrow(LobbyNotFoundException::new);

        joinLobby(userId, sessionId, lobby);
    }

    public void startGame(Lobby lobby) {
    }

    public void onPlayerReady(String userId, boolean ready) throws LobbyNotFoundException {
        String lobbyId = userPresence.getUserPresence(userId).getLobbyId();

        if (lobbyId == null) {
            throw new LobbyNotFoundException();
        }

        Lobby lobby = lobbyRepository.findById(lobbyId).orElseThrow(LobbyNotFoundException::new);

        LobbyPlayer player = lobby.getPlayerById(userId);

        if (player == null) {
            throw new LobbyNotFoundException();
        }

        player.setStatus(ready ? LobbyPlayerStatus.READY : LobbyPlayerStatus.NOT_READY);

        lobbyRepository.save(lobby);
        lobbyEventPublisher.playerStatusChanged(lobby, player);

        // Check if all players are ready
        // TODO: add actual matchmaking. For now only start if lobby is full and all players are ready
        if (lobby.allPlayersReady() && lobby.isFull()) {
            startGame(lobby);
        }
    }

}
