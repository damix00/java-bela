package pro.damjan.belabackend.lobby.ws;

import org.springframework.stereotype.Service;
import pro.damjan.belabackend.lobby.model.Lobby;
import pro.damjan.belabackend.lobby.model.LobbyPlayer;
import pro.damjan.belabackend.lobby.ws.dto.outgoing.LobbyHostChangedEvent;
import pro.damjan.belabackend.lobby.ws.dto.outgoing.LobbyPlayerJoinedEvent;
import pro.damjan.belabackend.lobby.ws.dto.outgoing.LobbyPlayerLeftEvent;
import pro.damjan.belabackend.lobby.ws.dto.outgoing.LobbySnapshotEvent;
import pro.damjan.belabackend.websocket.GameWebSocketHandler;
import pro.damjan.belabackend.websocket.events.dto.OutgoingEvent;

@Service
public class LobbyEventPublisher {

    private final GameWebSocketHandler ws;

    public LobbyEventPublisher(GameWebSocketHandler ws) {
        this.ws = ws;
    }

    private void broadcastToLobbyExcept(Lobby lobby, String excludedUserId, OutgoingEvent event) {
        for (LobbyPlayer player : lobby.getPlayers()) {
            if (player == null) continue;
            if (player.getUserId().equals(excludedUserId)) continue;

            ws.sendToUser(player.getUserId(), event);
        }
    }

    private void broadcastToLobby(Lobby lobby, OutgoingEvent event) {
        for (LobbyPlayer player : lobby.getPlayers()) {
            if (player == null) continue;

            ws.sendToUser(player.getUserId(), event);
        }
    }

    public void playerJoined(Lobby lobby, LobbyPlayer player) {
        ws.sendToUser(player.getUserId(), new LobbySnapshotEvent(lobby));
        broadcastToLobbyExcept(lobby, player.getUserId(), new LobbyPlayerJoinedEvent(player));
    }

    public void playerLeft(Lobby lobby, String userId) {
        broadcastToLobby(lobby, new LobbyPlayerLeftEvent(userId));
    }

    public void sendSnapshot(Lobby lobby, String userId) {
        ws.sendToUser(userId, new LobbySnapshotEvent(lobby));
    }

    public void lobbyHostChanged(Lobby lobby, String newHostUserId) {
        broadcastToLobby(lobby, new LobbyHostChangedEvent(newHostUserId));
    }
}
