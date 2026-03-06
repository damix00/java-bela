package pro.damjan.belabackend.lobby;

import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;
import pro.damjan.belabackend.lobby.model.Lobby;
import pro.damjan.belabackend.lobby.model.LobbyPlayer;
import pro.damjan.belabackend.lobby.model.LobbyPlayerStatus;
import pro.damjan.belabackend.lobby.ws.dto.outgoing.LobbyJoinedEvent;
import pro.damjan.belabackend.user.User;
import pro.damjan.belabackend.user.presence.PresenceService;
import pro.damjan.belabackend.user.presence.model.UserPresence;
import pro.damjan.belabackend.websocket.GameWebSocketHandler;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.UUID;

@Service
public class LobbyService {

    private final LobbyRepository lobbyRepository;
    private final PresenceService userPresence;
    private final GameWebSocketHandler ws;

    public LobbyService(LobbyRepository lobbyRepository, PresenceService userPresence, GameWebSocketHandler ws) {
        this.lobbyRepository = lobbyRepository;
        this.userPresence = userPresence;
        this.ws = ws;
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

    @Transactional
    public Lobby createLobby(User creator) {
        Lobby lobby = new Lobby();
        lobby.setId(this.generateLobbyId());

        // Get empty player list and set the first player as the creator
        List<LobbyPlayer> players = lobby.getPlayers();

        // 1st player is the creator, set to not ready. Others are null.
        players.set(0, new LobbyPlayer(creator.getId(), true, LobbyPlayerStatus.NOT_READY));

        lobby.setPlayers(players);

        lobbyRepository.save(lobby);
        userPresence.setUserLobby(creator.getId(), lobby.getId());

        // Emit lobby joined event to player
        ws.sendToUser(creator.getId(), new LobbyJoinedEvent(lobby));

        return lobby;
    }

}
