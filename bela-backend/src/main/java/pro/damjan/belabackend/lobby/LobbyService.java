package pro.damjan.belabackend.lobby;

import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;
import pro.damjan.belabackend.lobby.model.Lobby;
import pro.damjan.belabackend.lobby.model.LobbyPlayer;
import pro.damjan.belabackend.lobby.model.LobbyPlayerStatus;
import pro.damjan.belabackend.user.User;

import java.util.UUID;

@Service
public class LobbyService {

    private final LobbyRepository lobbyRepository;

    public LobbyService(LobbyRepository lobbyRepository) {
        this.lobbyRepository = lobbyRepository;
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

        LobbyPlayer[] players = new LobbyPlayer[4];
        players[0] = new LobbyPlayer(creator.getId(), true, LobbyPlayerStatus.NOT_READY);
        lobby.setPlayers(players);

        lobbyRepository.save(lobby);

        return lobby;
    }

}
