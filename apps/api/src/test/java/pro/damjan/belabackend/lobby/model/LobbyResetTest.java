package pro.damjan.belabackend.lobby.model;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import pro.damjan.belabackend.game.model.config.GameConfiguration;

import static org.assertj.core.api.Assertions.assertThat;

class LobbyResetTest {

    private Lobby lobby;

    @BeforeEach
    void setUp() {
        lobby = new Lobby();
        lobby.setId("lobby-id");
        lobby.setGameConfiguration(GameConfiguration.privateGame(701));
        lobby.setStatus(LobbyStatus.IN_GAME);
        lobby.setGameId("game-id");
        lobby.setJoinable(false);
    }

    @Test
    void resetReopensTheLobbyAndClearsTheFinishedGame() {
        lobby.addPlayer(new LobbyPlayer("host-id", true, LobbyPlayerStatus.READY));

        lobby.resetAfterGame();

        assertThat(lobby.getStatus()).isEqualTo(LobbyStatus.IN_LOBBY);
        assertThat(lobby.getGameId()).isNull();
        assertThat(lobby.isJoinable()).isTrue();
    }

    @Test
    void resetKeepsSeatsAndConfigurationButClearsReady() {
        lobby.addPlayer(new LobbyPlayer("host-id", true, LobbyPlayerStatus.READY));
        lobby.addPlayer(new LobbyPlayer("guest-id", false, LobbyPlayerStatus.READY));

        lobby.resetAfterGame();

        assertThat(lobby.getGameConfiguration()).isEqualTo(GameConfiguration.privateGame(701));
        assertThat(lobby.findPlayerById("host-id").orElseThrow().getSeat()).isEqualTo(0);
        assertThat(lobby.findPlayerById("guest-id").orElseThrow().getSeat()).isEqualTo(1);
        assertThat(lobby.getActivePlayers())
                .allMatch(player -> player.getStatus() == LobbyPlayerStatus.NOT_READY);
        assertThat(lobby.getHost().orElseThrow().getUserId()).isEqualTo("host-id");
    }

    @Test
    void resetDropsBotsSoTheirSeatsAreOpenAgain() {
        lobby.addPlayer(new LobbyPlayer("host-id", true, LobbyPlayerStatus.READY));
        lobby.addPlayer(LobbyPlayer.createBot());
        lobby.addPlayer(LobbyPlayer.createBot());
        lobby.addPlayer(LobbyPlayer.createBot());

        lobby.resetAfterGame();

        assertThat(lobby.getActivePlayers()).noneMatch(LobbyPlayer::isBot);
        assertThat(lobby.getPlayerCount()).isEqualTo(1);
        assertThat(lobby.isFull()).isFalse();
    }

    @Test
    void resetPromotesAHostWhenTheOnlyOneWasABot() {
        LobbyPlayer bot = LobbyPlayer.createBot();
        bot.setHost(true);
        lobby.addPlayer(bot);
        lobby.addPlayer(new LobbyPlayer("guest-id", false, LobbyPlayerStatus.READY));

        lobby.resetAfterGame();

        assertThat(lobby.getHost().orElseThrow().getUserId()).isEqualTo("guest-id");
    }
}
