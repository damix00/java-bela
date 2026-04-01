package pro.damjan.belabackend.lobby.repository;

import org.springframework.data.repository.CrudRepository;
import pro.damjan.belabackend.lobby.model.Lobby;

import java.util.Optional;

public interface LobbyRepository extends CrudRepository<Lobby, String> {
    Optional<Lobby> findByInviteCode(String inviteCode);
    boolean existsByInviteCode(String inviteCode);
}
