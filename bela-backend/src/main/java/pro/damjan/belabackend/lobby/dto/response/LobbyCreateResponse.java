package pro.damjan.belabackend.lobby.dto.response;

import lombok.Builder;
import lombok.Getter;
import pro.damjan.belabackend.lobby.model.Lobby;
import pro.damjan.belabackend.lobby.model.LobbyPlayer;

import java.util.List;

@Getter
@Builder
public class LobbyCreateResponse {
    private String id;
    private List<LobbyPlayer> players;

    public static LobbyCreateResponse fromLobby(Lobby lobby) {
        return LobbyCreateResponse.builder()
                .id(lobby.getId())
                .players(lobby.getPlayers())
                .build();
    }
}
