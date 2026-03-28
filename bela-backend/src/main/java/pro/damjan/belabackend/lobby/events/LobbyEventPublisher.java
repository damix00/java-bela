package pro.damjan.belabackend.lobby.events;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import pro.damjan.belabackend.lobby.model.Lobby;
import pro.damjan.belabackend.lobby.model.LobbyPlayer;
import pro.damjan.belabackend.lobby.events.dto.outgoing.LobbyHostChangedEvent;
import pro.damjan.belabackend.lobby.events.dto.outgoing.LobbyPlayerJoinedEvent;
import pro.damjan.belabackend.lobby.events.dto.outgoing.LobbyPlayerLeftEvent;
import pro.damjan.belabackend.lobby.events.dto.outgoing.LobbyPlayerStatusChangeEvent;
import pro.damjan.belabackend.lobby.events.dto.outgoing.LobbyInitialStateEvent;
import pro.damjan.belabackend.user.presence.session.SessionService;
import pro.damjan.belabackend.user.presence.session.UserSession;
import pro.damjan.belabackend.websocket.GameWebSocketHandler;
import pro.damjan.belabackend.websocket.events.dto.OutgoingEvent;

@Service
@RequiredArgsConstructor
public class LobbyEventPublisher {

    private final GameWebSocketHandler ws;
    private final SessionService sessionService;

    public void sendToActiveSession(String userId, OutgoingEvent event) {
        UserSession session = sessionService.getActiveSession(userId);
        if (session != null) {
            ws.sendToUserSession(userId, session.getId(), event);
        }
    }

    private void broadcastToLobbyExcept(Lobby lobby, String excludedUserId, OutgoingEvent event) {
        for (LobbyPlayer player : lobby.getPlayersAsList()) {
            if (player == null) continue;
            if (player.getUserId().equals(excludedUserId)) continue;

            sendToActiveSession(player.getUserId(), event);
        }
    }

    private void broadcastToLobby(Lobby lobby, OutgoingEvent event) {
        for (LobbyPlayer player : lobby.getPlayersAsList()) {
            if (player == null) continue;

            sendToActiveSession(player.getUserId(), event);
        }
    }

    public void playerJoined(Lobby lobby, LobbyPlayer player) {
        sendToActiveSession(player.getUserId(), new LobbyInitialStateEvent(lobby));
        broadcastToLobbyExcept(lobby, player.getUserId(), new LobbyPlayerJoinedEvent(player));
    }

    public void playerLeft(Lobby lobby, String userId) {
        broadcastToLobby(lobby, new LobbyPlayerLeftEvent(userId));
    }

    public void sendSnapshot(Lobby lobby, String userId) {
        sendToActiveSession(userId, new LobbyInitialStateEvent(lobby));
    }

    public void lobbyHostChanged(Lobby lobby, String newHostUserId) {
        broadcastToLobby(lobby, new LobbyHostChangedEvent(newHostUserId));
    }

    public void playerStatusChanged(Lobby lobby, LobbyPlayer player) {
        broadcastToLobby(lobby, new LobbyPlayerStatusChangeEvent(player.getUserId(), player.getStatus()));
    }
}
