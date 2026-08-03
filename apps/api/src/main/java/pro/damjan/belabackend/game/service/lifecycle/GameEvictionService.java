package pro.damjan.belabackend.game.service.lifecycle;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import pro.damjan.belabackend.game.service.BeloteGameService;

@Service
@RequiredArgsConstructor
public class GameEvictionService {

    private final BeloteGameService beloteGameService;

    public void dropGame(String gameId) {
        beloteGameService.dropGame(gameId);
    }
}
