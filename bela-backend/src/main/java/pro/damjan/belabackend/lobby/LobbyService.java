package pro.damjan.belabackend.lobby;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import pro.damjan.belabackend.lobby.exception.AlreadyInLobbyException;
import pro.damjan.belabackend.lobby.exception.LobbyFullException;
import pro.damjan.belabackend.lobby.exception.LobbyNotFoundException;
import pro.damjan.belabackend.lobby.model.Lobby;
import pro.damjan.belabackend.lobby.model.LobbyPlayer;
import pro.damjan.belabackend.lobby.model.LobbyPlayerStatus;
import pro.damjan.belabackend.lobby.events.LobbyEventPublisher;
import pro.damjan.belabackend.user.presence.UserPresence;
import pro.damjan.belabackend.user.presence.UserPresenceService;
import pro.damjan.belabackend.user.presence.session.SessionService;
import pro.damjan.belabackend.user.presence.session.exception.SessionLockException;

import java.security.SecureRandom;
import java.util.List;
import java.util.Map;
import java.util.Optional;
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

    public Lobby createLobby(String creatorId, String sessionId) {
        if (sessionService.userHasActiveSession(creatorId)) {
            throw new SessionLockException();
        }

        if (getUserLobbyId(creatorId) != null) {
            throw new AlreadyInLobbyException();
        }

        Lobby lobby = new Lobby();
        lobby.setId(generateLobbyId());
        lobby.setInviteCode(generateInviteCode());

        // Get empty player list and set the first player as the creator
        Map<Integer, LobbyPlayer> players = lobby.getPlayerSeats();

        // 1st player is the creator, set to not ready. Others are null.
        // No need to call lobby.setPlayers because this is a reference.
        lobby.addPlayer(new LobbyPlayer(creatorId, true, LobbyPlayerStatus.NOT_READY));

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
        if (getUserLobbyId(userId) != null) {
            throw new AlreadyInLobbyException();
        }

        if (lobby.isFull()) {
            throw new LobbyFullException();
        }

        LobbyPlayer newPlayer = new LobbyPlayer(
                userId,
                false,
                LobbyPlayerStatus.NOT_READY
        );

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
        String lobbyId = getUserLobbyId(userId);
        if (lobbyId == null) return;

        Lobby lobby = lobbyRepository.findById(lobbyId).orElse(null);
        if (lobby == null) {
            userPresenceService.cleanUpUser(userId);
            return;
        }

        Lobby.RemoveResult removeResult = lobby.removePlayer(userId);
        int remainingPlayers = lobby.getPlayerCount();

        userPresenceService.cleanUpUser(userId);

        // Persistence and events
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

    public void startGame(Lobby lobby) {
    }

    public void onPlayerReady(String userId, boolean ready) throws LobbyNotFoundException {
        String lobbyId = getUserLobbyId(userId);

        if (lobbyId == null) {
            throw new LobbyNotFoundException();
        }

        Lobby lobby = lobbyRepository.findById(lobbyId).orElseThrow(LobbyNotFoundException::new);

        LobbyPlayer player = lobby.findPlayerById(userId).orElseThrow(LobbyNotFoundException::new);
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
