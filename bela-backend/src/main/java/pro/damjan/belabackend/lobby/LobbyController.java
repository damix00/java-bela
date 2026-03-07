package pro.damjan.belabackend.lobby;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import pro.damjan.belabackend.lobby.dto.response.LobbyCreateResponse;
import pro.damjan.belabackend.lobby.model.Lobby;
import pro.damjan.belabackend.user.User;

@RestController
@RequestMapping("/lobbies")
public class LobbyController {

    private final LobbyService lobbyService;

    public LobbyController(LobbyService lobbyService) {
        this.lobbyService = lobbyService;
    }

    @PostMapping("/new")
    public LobbyCreateResponse createLobby(@AuthenticationPrincipal User user) {
        Lobby lobby = lobbyService.createLobby(user.getId());

        return LobbyCreateResponse.fromLobby(lobby);
    }

    @PostMapping("/join/code")
    public boolean joinLobbyByCode(@AuthenticationPrincipal User user, @RequestParam("code") String inviteCode) {
        lobbyService.joinLobbyViaCode(user.getId(), inviteCode);
        return true;
    }
}
