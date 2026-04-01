package pro.damjan.belabackend.game.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import pro.damjan.belabackend.game.model.BeloteGame;
import pro.damjan.belabackend.game.model.GameStatus;
import pro.damjan.belabackend.game.model.player.GamePlayer;
import pro.damjan.belabackend.game.model.player.Team;
import pro.damjan.belabackend.game.model.player.TeamPair;
import pro.damjan.belabackend.game.repository.BeloteGameRepository;
import pro.damjan.belabackend.lobby.model.LobbyPlayer;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class BeloteGameService {

    private final BeloteGameRepository beloteGameRepository;

    public BeloteGame createGame(List<LobbyPlayer> lobbyPlayers) {
        List<GamePlayer> players = lobbyPlayers
                .stream()
                .map(p -> new GamePlayer(p.getUserId(), p.getSeat()))
                .toList();

        TeamPair teams = Team.pairFrom(players);

        return BeloteGame.builder()
                .id(UUID.randomUUID().toString())
                .team1(teams.teamA())
                .team2(teams.teamB())
                .maxPoints(1001)
                .status(GameStatus.WAITING)
                .build();
    }

    public BeloteGame findGameById(String gameId) {
        return beloteGameRepository.findById(gameId).orElse(null);
    }

}
