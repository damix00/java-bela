package pro.damjan.belabackend.lobby;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import pro.damjan.belabackend.lobby.model.Lobby;
import pro.damjan.belabackend.lobby.model.LobbyPlayer;
import pro.damjan.belabackend.lobby.model.LobbyPlayerStatus;
import pro.damjan.belabackend.user.User;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class LobbyServiceTest {

    @Mock
    private LobbyRepository lobbyRepository;

    private LobbyService lobbyService;

    @BeforeEach
    void setUp() {
        lobbyService = new LobbyService(lobbyRepository);
    }

    @Test
    void createLobby_savesLobbyWithCreatorAsFirstPlayer() {
        User creator = new User();
        creator.setId("user-1");

        when(lobbyRepository.existsById(anyString())).thenReturn(false);
        when(lobbyRepository.save(any(Lobby.class))).thenAnswer(inv -> inv.getArgument(0));

        Lobby lobby = lobbyService.createLobby(creator);

        assertNotNull(lobby.getId());

        LobbyPlayer firstPlayer = lobby.getPlayers().get(0);
        assertNotNull(firstPlayer);
        assertEquals("user-1", firstPlayer.getUserId());
        assertTrue(firstPlayer.isHost());
        assertEquals(LobbyPlayerStatus.NOT_READY, firstPlayer.getStatus());

        // Remaining 3 slots should be null
        for (int i = 1; i < 4; i++) {
            assertNull(lobby.getPlayers().get(i));
        }

        verify(lobbyRepository).save(lobby);
    }

    @Test
    void createLobby_generatesUniqueId_whenFirstIdExists() {
        User creator = new User();
        creator.setId("user-1");

        // First UUID already exists, second doesn't
        when(lobbyRepository.existsById(anyString()))
                .thenReturn(true)
                .thenReturn(false);
        when(lobbyRepository.save(any(Lobby.class))).thenAnswer(inv -> inv.getArgument(0));

        Lobby lobby = lobbyService.createLobby(creator);

        assertNotNull(lobby.getId());
        verify(lobbyRepository, atLeast(2)).existsById(anyString());
    }

    @Test
    void createLobby_lobbyHasExactlyFourSlots() {
        User creator = new User();
        creator.setId("user-1");

        when(lobbyRepository.existsById(anyString())).thenReturn(false);
        when(lobbyRepository.save(any(Lobby.class))).thenAnswer(inv -> inv.getArgument(0));

        Lobby lobby = lobbyService.createLobby(creator);

        assertEquals(4, lobby.getPlayers().size());
    }
}

