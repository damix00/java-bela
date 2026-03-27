package pro.damjan.belabackend.lobby.events;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import pro.damjan.belabackend.lobby.LobbyService;
import pro.damjan.belabackend.lobby.events.dto.incoming.JoinLobbyViaCodeCommand;
import pro.damjan.belabackend.lobby.events.dto.incoming.LobbyReadyCommand;
import pro.damjan.belabackend.user.User;
import pro.damjan.belabackend.user.presence.session.UserSession;
import pro.damjan.belabackend.websocket.events.OnEvent;

@Component
@RequiredArgsConstructor
public class LobbyEventHandler {

    private final LobbyService lobbyService;

    @OnEvent("lobby:ready")
    public void onLobbyReady(UserSession session, User user, LobbyReadyCommand command) {
        lobbyService.onPlayerReady(user.getId(), command.isReady());
    }

    @OnEvent("lobby:create")
    public void createLobby(UserSession session, User user) {
        lobbyService.createLobby(user.getId(), session.getId());
    }

    @OnEvent("lobby:join:code")
    public void joinLobbyByCode(UserSession session, User user, JoinLobbyViaCodeCommand command) {
        lobbyService.joinLobbyViaCode(user.getId(), session.getId(), command.getInviteCode());
    }
}
