package pro.damjan.belabackend.lobby.events;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import pro.damjan.belabackend.game.model.config.GameConfiguration;
import pro.damjan.belabackend.game.model.config.MatchType;
import pro.damjan.belabackend.lobby.events.dto.incoming.ChangeLobbyConfigCommand;
import pro.damjan.belabackend.lobby.exception.InvalidLobbyConfigurationException;
import pro.damjan.belabackend.lobby.service.LobbyService;
import pro.damjan.belabackend.lobby.events.dto.incoming.JoinLobbyViaCodeCommand;
import pro.damjan.belabackend.lobby.events.dto.incoming.LobbyReadyCommand;
import pro.damjan.belabackend.lobby.events.dto.incoming.SwapSeatsCommand;
import pro.damjan.belabackend.user.User;
import pro.damjan.belabackend.user.presence.session.UserSession;
import pro.damjan.belabackend.websocket.events.OnEvent;

import java.util.Locale;

@Component
@RequiredArgsConstructor
public class LobbyEventHandler {

    private final LobbyService lobbyService;

    // Joining/leaving lobbies

    @OnEvent("lobby:create")
    public void createLobby(UserSession session, User user) {
        lobbyService.createLobby(user.getId(), session.getId());
    }

    @OnEvent("lobby:join:code")
    public void joinLobbyByCode(UserSession session, User user, JoinLobbyViaCodeCommand command) {
        lobbyService.joinLobbyViaCode(user.getId(), session.getId(), command.getInviteCode());
    }

    @OnEvent("lobby:leave")
    public void leaveLobby(UserSession session, User user) {
        lobbyService.leaveLobby(user.getId());
    }

    // Managing lobby state

    @OnEvent("lobby:ready")
    public void onLobbyReady(UserSession session, User user, LobbyReadyCommand command) {
        lobbyService.onPlayerReady(user.getId(), command.isReady());
    }

    @OnEvent("lobby:swapSeats")
    public void swapSeats(UserSession session, User user, SwapSeatsCommand command) {
        lobbyService.swapSeats(user.getId(), command.getSeat());
    }

    @OnEvent("lobby:changeConfig")
    public void changeConfig(UserSession session, User user, ChangeLobbyConfigCommand command) {
        lobbyService.updateConfig(user.getId(), parseConfiguration(command));
    }

    private GameConfiguration parseConfiguration(ChangeLobbyConfigCommand command) {
        try {
            MatchType matchType = MatchType.valueOf(command.getMatchType().trim().toUpperCase(Locale.ROOT));
            return GameConfiguration.forMatchType(matchType, command.getPoints());
        } catch (IllegalArgumentException | NullPointerException exception) {
            throw new InvalidLobbyConfigurationException();
        }
    }
}
