package pro.damjan.belabackend.game.repository;

import org.springframework.data.repository.CrudRepository;
import pro.damjan.belabackend.game.model.BeloteGame;

public interface BeloteGameRepository extends CrudRepository<BeloteGame, String> {
}
