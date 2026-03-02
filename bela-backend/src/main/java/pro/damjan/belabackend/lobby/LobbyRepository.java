package pro.damjan.belabackend.lobby;

import org.springframework.data.repository.CrudRepository;
import pro.damjan.belabackend.lobby.model.Lobby;

public interface LobbyRepository extends CrudRepository<Lobby, String> {
}
