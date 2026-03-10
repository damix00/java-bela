package pro.damjan.belabackend.lobby.events;

import org.springframework.stereotype.Component;
import org.springframework.web.socket.WebSocketSession;
import pro.damjan.belabackend.lobby.LobbyService;
import pro.damjan.belabackend.lobby.events.dto.incoming.LobbyReadyCommand;
import pro.damjan.belabackend.websocket.events.OnEvent;

@Component
public class LobbyEventHandler {

    private final LobbyService lobbyService;

    public LobbyEventHandler(LobbyService lobbyService) {
        this.lobbyService = lobbyService;
    }

    @OnEvent("lobby:ready")
    public void onLobbyReady(WebSocketSession session, String userId, LobbyReadyCommand command) {
        lobbyService.onPlayerReady(userId, command.isReady());
    }
}
