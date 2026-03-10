package pro.damjan.belabackend.lobby;

import org.springframework.stereotype.Service;
import pro.damjan.belabackend.lobby.exception.AlreadyInLobbyException;
import pro.damjan.belabackend.lobby.exception.LobbyFullException;
import pro.damjan.belabackend.lobby.exception.LobbyNotFoundException;
import pro.damjan.belabackend.lobby.model.Lobby;
import pro.damjan.belabackend.lobby.model.LobbyPlayer;
import pro.damjan.belabackend.lobby.model.LobbyPlayerStatus;
import pro.damjan.belabackend.lobby.events.LobbyEventPublisher;
import pro.damjan.belabackend.user.presence.PresenceService;

import java.util.UUID;

@Service
public class LobbyService {

    private final LobbyRepository lobbyRepository;
    private final PresenceService userPresence;
    private final LobbyEventPublisher lobbyEventPublisher;

    public LobbyService(LobbyRepository lobbyRepository, PresenceService userPresence, LobbyEventPublisher lobbyEventPublisher) {
        this.lobbyRepository = lobbyRepository;
        this.userPresence = userPresence;
        this.lobbyEventPublisher = lobbyEventPublisher;
    }

    private String generateLobbyId() {
        String uuid = UUID.randomUUID().toString();

        do {
            if (!lobbyRepository.existsById(uuid)) {
                return uuid;
            }
            uuid = UUID.randomUUID().toString();
        }
        while (true);
    }

    private String generateInviteCode() {
        // Random 6 character alphanumeric code
        String chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        StringBuilder code = new StringBuilder();

        do {
            for (int i = 0; i < 6; i++) {
                code.append(chars.charAt((int) (Math.random() * chars.length())));
            }
            String inviteCode = code.toString();
            if (!lobbyRepository.existsByInviteCode(inviteCode)) {
                return inviteCode;
            }
            code.setLength(0); // Reset the StringBuilder
        } while (true);
    }

    public Lobby createLobby(String creatorId) {
        Lobby lobby = new Lobby();
        lobby.setId(this.generateLobbyId());
        lobby.setInviteCode(this.generateInviteCode());

        // Get empty player list and set the first player as the creator
        LobbyPlayer[] players = lobby.getPlayers();

        // 1st player is the creator, set to not ready. Others are null.
        // No need to call lobby.setPlayers because this is a reference.
        players[0] = new LobbyPlayer(creatorId, true, LobbyPlayerStatus.NOT_READY);

        lobbyRepository.save(lobby);
        userPresence.setUserLobby(creatorId, lobby.getId());

        // Emit lobby joined event to player
        lobbyEventPublisher.sendSnapshot(lobby, creatorId);

        return lobby;
    }

    private void joinLobby(String userId, Lobby lobby) throws AlreadyInLobbyException, LobbyFullException {
        if (lobby.isPlayerInLobby(userId)) {
            throw new AlreadyInLobbyException();
        }

        // Leave current lobby if in one
        if (userPresence.getUserPresence(userId).getLobbyId() != null) {
            this.leaveLobby(userId);
        }

        LobbyPlayer[] players = lobby.getPlayers();

        for (int i = 0; i < Lobby.MAX_PLAYERS; i++) {
            if (players[i] == null) {
                players[i] = new LobbyPlayer(
                        userId,
                        false,
                        LobbyPlayerStatus.NOT_READY
                );

                lobbyRepository.save(lobby);
                userPresence.setUserLobby(userId, lobby.getId());

                lobbyEventPublisher.playerJoined(lobby, players[i]);

                return;
            }
        }

        throw new LobbyFullException();
    }

    public void leaveLobby(String userId) {
        String lobbyId = userPresence.getUserPresence(userId).getLobbyId();

        if (lobbyId == null) return;

        Lobby lobby = lobbyRepository.findById(lobbyId).orElse(null);

        if (lobby == null) return;

        // Remove player from lobby
        LobbyPlayer[] players = lobby.getPlayers();

        for (int i = 0; i < Lobby.MAX_PLAYERS; i++) {
            if (players[i] != null && players[i].getUserId().equals(userId)) {
                players[i] = null;

                userPresence.setUserLobby(userId, null);

                // Last player left, delete lobby
                if (lobby.getLobbyPlayerCount() == 0) {
                    lobbyRepository.delete(lobby);
                    return;
                }

                if (lobby.getHost() == null) {
                    LobbyPlayer newHost = lobby.assignNewHost();

                    if (newHost == null) {
                        // This should never happen because we check if the lobby is empty above, but just in case
                        lobbyRepository.delete(lobby);

                        throw new IllegalStateException("Lobby has no host but is not empty");
                    }
                    lobbyEventPublisher.lobbyHostChanged(lobby, newHost.getUserId());
                }

                lobbyRepository.save(lobby);
                lobbyEventPublisher.playerLeft(lobby, userId);

                break;
            }
        }
    }

    public void joinLobbyViaCode(String userId, String code) throws LobbyNotFoundException, AlreadyInLobbyException, LobbyFullException {
        Lobby lobby = lobbyRepository.findByInviteCode(code).orElseThrow(LobbyNotFoundException::new);

        this.joinLobby(userId, lobby);
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

        player.setStatus(LobbyPlayerStatus.READY);

        lobbyRepository.save(lobby);

        lobbyEventPublisher.playerStatusChanged(lobby, player);
    }

}
