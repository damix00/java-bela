package pro.damjan.belabackend.lobby.exception;

import org.springframework.http.HttpStatus;
import pro.damjan.belabackend.exception.ExceptionResponse;

/**
 * Refuses a change to a lobby that is queued for a match.
 *
 * The queue is indexed by a lobby's shape — how many players it needs on each team — so moving a
 * seat or changing the rules underneath a waiting ticket makes it describe a lobby that no longer
 * exists. Matchmaking would notice and quietly drop the ticket, leaving the lobby saying it was
 * searching while nothing was looking for it. Refusing is the honest answer; the client hides
 * these controls while a search is running, so this is the guard rather than the usual path.
 */
public class LobbySearchingException extends ExceptionResponse {

    public LobbySearchingException() {
        super(HttpStatus.CONFLICT, "Lobby is searching for a match");
    }
}
