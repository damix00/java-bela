package pro.damjan.belabackend.game.repository;

import org.springframework.data.repository.CrudRepository;
import org.springframework.stereotype.Repository;
import pro.damjan.belabackend.game.model.BeloteGame;

@Repository
public interface BeloteGameRepository extends CrudRepository<BeloteGame, String> {
}