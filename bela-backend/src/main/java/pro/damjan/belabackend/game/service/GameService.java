package pro.damjan.belabackend.game.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import pro.damjan.belabackend.game.model.BeloteGame;
import pro.damjan.belabackend.game.model.GamePlayer;
import pro.damjan.belabackend.game.repository.BeloteGameRepository;

@Service
@RequiredArgsConstructor
public class GameService {

    private final BeloteGameRepository beloteGameRepository;

    public BeloteGame createGame(String gameId) {
        BeloteGame game = new BeloteGame();
        game.setId(gameId);
        
        return beloteGameRepository.save(game);
    }

}
