package pro.damjan.belabackend.lobby.events.dto.incoming;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@RequiredArgsConstructor
public class JoinLobbyViaCodeCommand {

    @Getter
    private final String inviteCode;
}
