package pro.damjan.belabackend.lobby.events;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import pro.damjan.belabackend.game.model.config.GameConfiguration;
import pro.damjan.belabackend.lobby.events.dto.incoming.ChangeLobbyConfigCommand;
import pro.damjan.belabackend.lobby.exception.InvalidLobbyConfigurationException;
import pro.damjan.belabackend.lobby.service.LobbyService;
import pro.damjan.belabackend.user.User;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

class LobbyEventHandlerTest {

    private LobbyService lobbyService;
    private LobbyEventHandler handler;
    private User user;

    @BeforeEach
    void setUp() {
        lobbyService = mock(LobbyService.class);
        handler = new LobbyEventHandler(lobbyService);
        user = new User();
        user.setId("host-id");
    }

    @Test
    void changeConfigMapsPrivateConfigurationAndDelegatesToService() {
        handler.changeConfig(null, user, new ChangeLobbyConfigCommand("private", 701));

        verify(lobbyService).updateConfig("host-id", GameConfiguration.privateGame(701));
    }

    @Test
    void changeConfigUsesFixedScoreForPresetMatchType() {
        handler.changeConfig(null, user, new ChangeLobbyConfigCommand("RANKED", 42));

        verify(lobbyService).updateConfig("host-id", GameConfiguration.ranked());
    }

    @Test
    void changeConfigRejectsUnknownMatchType() {
        assertThatThrownBy(() -> handler.changeConfig(
                null, user, new ChangeLobbyConfigCommand("tournament", 501)))
                .isInstanceOf(InvalidLobbyConfigurationException.class);

        verify(lobbyService, never()).updateConfig(
                org.mockito.ArgumentMatchers.anyString(),
                org.mockito.ArgumentMatchers.any(GameConfiguration.class));
    }
}
