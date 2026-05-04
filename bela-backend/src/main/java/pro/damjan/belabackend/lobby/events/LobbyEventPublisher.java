package pro.damjan.belabackend.lobby.events;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import pro.damjan.belabackend.game.model.BeloteGame;
import pro.damjan.belabackend.lobby.events.dto.outgoing.*;
import pro.damjan.belabackend.lobby.model.Lobby;
import pro.damjan.belabackend.lobby.model.LobbyPlayer;
import pro.damjan.belabackend.user.presence.session.SessionService;
import pro.damjan.belabackend.websocket.events.WebSocketPublisher;
import pro.damjan.belabackend.websocket.events.dto.OutgoingEvent;

import java.util.Map;

@Service
@RequiredArgsConstructor
public class LobbyEventPublisher {

    private final SessionService sessionService;
    private final WebSocketPublisher webSocketPublisher;

    private void broadcastToLobbyExcept(Lobby lobby, String excludedUserId, OutgoingEvent event) {
        for (LobbyPlayer player : lobby.getPlayersAsList()) {
            if (player == null) continue;
            if (player.getUserId().equals(excludedUserId)) continue;

            webSocketPublisher.sendToActiveSession(player.getUserId(), event);
        }
    }

    private void broadcastToLobby(Lobby lobby, OutgoingEvent event) {
        for (LobbyPlayer player : lobby.getPlayersAsList()) {
            if (player == null || player.isBot()) continue;

            webSocketPublisher.sendToActiveSession(player.getUserId(), event);
        }
    }

    public void playerJoined(Lobby lobby, LobbyPlayer player) {
        if (!player.isBot()) {
            webSocketPublisher.sendToActiveSession(player.getUserId(), new LobbyInitialStateEvent(lobby));
        }
        broadcastToLobbyExcept(lobby, player.getUserId(), new LobbyPlayerJoinedEvent(player));
    }

    public void playerLeft(Lobby lobby, String userId) {
        broadcastToLobby(lobby, new LobbyPlayerLeftEvent(userId));
    }

    public void sendSnapshot(Lobby lobby, String userId) {
        webSocketPublisher.sendToActiveSession(userId, new LobbyInitialStateEvent(lobby));
    }

    public void lobbyHostChanged(Lobby lobby, String newHostUserId) {
        broadcastToLobby(lobby, new LobbyHostChangedEvent(newHostUserId));
    }

    public void playerStatusChanged(Lobby lobby, LobbyPlayer player) {
        broadcastToLobby(lobby, new LobbyPlayerStatusChangeEvent(player.getUserId(), player.getStatus()));
    }

    public void seatsUpdated(Lobby lobby) {
        broadcastToLobby(lobby, new LobbySeatsUpdatedEvent(lobby.getPlayerSeats()));
    }

    public void gameCreated(Lobby lobby, BeloteGame game) {
        broadcastToLobby(lobby, new LobbyGameCreatedEvent(lobby, game));
    }
}
