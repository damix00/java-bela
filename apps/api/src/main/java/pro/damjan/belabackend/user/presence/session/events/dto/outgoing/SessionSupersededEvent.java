package pro.damjan.belabackend.user.presence.session.events.dto.outgoing;

import pro.damjan.belabackend.websocket.events.dto.OutgoingEvent;

/**
 * Sent to the connection that just lost the player's seat to a newer one.
 *
 * Addressed to a single session rather than to the user, so the window that
 * took the seat is not told it lost it. It carries no payload: the only thing
 * the old window can do with this is stop.
 */
public class SessionSupersededEvent extends OutgoingEvent {

    public SessionSupersededEvent() {
        super("session:superseded");
    }

}
