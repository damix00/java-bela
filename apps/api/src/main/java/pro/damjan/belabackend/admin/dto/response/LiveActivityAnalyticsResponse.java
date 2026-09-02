package pro.damjan.belabackend.admin.dto.response;

import lombok.Builder;
import lombok.Getter;

@Builder
@Getter
public class LiveActivityAnalyticsResponse {
    private long connectedUsers;
    private long sessions;
    private long lobbiesTotal;
    private long lobbiesInLobby;
    private long lobbiesMatchmaking;
    private long lobbiesInGame;
    private long gamesTotal;
    private long gamesWaiting;
    private long gamesInProgress;
    private long gamesFinished;
}
