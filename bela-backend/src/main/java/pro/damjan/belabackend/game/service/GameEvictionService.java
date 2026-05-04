package pro.damjan.belabackend.game.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class GameEvictionService {

    private final BeloteGameService beloteGameService;

    public void dropGame(String gameId) {
        beloteGameService.dropGame(gameId);
    }
}
