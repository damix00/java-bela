package pro.damjan.belabackend.admin.account;

import jakarta.annotation.PreDestroy;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Service;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;
import pro.damjan.belabackend.messaging.MessageBroker;
import pro.damjan.belabackend.user.presence.UserPresenceService;
import pro.damjan.belabackend.user.presence.session.SessionService;
import pro.damjan.belabackend.websocket.GameWebSocketHandler;

@Service
@Slf4j
public class AdminSessionTerminationService {
    static final String CHANNEL = "admin:session-termination";

    private final MessageBroker messageBroker;
    private final GameWebSocketHandler webSocketHandler;
    private final SessionService sessionService;
    private final UserPresenceService presenceService;
    private boolean subscribed;

    public AdminSessionTerminationService(MessageBroker messageBroker,
                                          GameWebSocketHandler webSocketHandler,
                                          SessionService sessionService,
                                          UserPresenceService presenceService) {
        this.messageBroker = messageBroker;
        this.webSocketHandler = webSocketHandler;
        this.sessionService = sessionService;
        this.presenceService = presenceService;
    }

    void subscribe() {
        messageBroker.subscribe(CHANNEL, (channel, userId) -> webSocketHandler.closeUserSessions(userId));
        subscribed = true;
    }

    @EventListener(ApplicationReadyEvent.class)
    void subscribeAfterStartup() {
        try {
            subscribe();
        } catch (RuntimeException exception) {
            // Redis-backed features already report their own availability. Do not make an
            // otherwise usable HTTP application fail its entire startup over this subscriber.
            log.warn("Could not subscribe to administrative session termination messages", exception);
        }
    }

    @PreDestroy
    void unsubscribe() {
        if (subscribed) {
            messageBroker.unsubscribe(CHANNEL);
        }
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void terminate(AdminAccountSignedOutEvent event) {
        try {
            sessionService.deleteUserSessions(event.userId());
            if (event.deletePresence()) {
                presenceService.deleteUserPresence(event.userId());
            }
        } catch (RuntimeException exception) {
            log.warn("Could not remove Redis state for administratively signed-out user [{}]",
                    event.userId(), exception);
        }

        // Do not depend on Redis pub/sub to close sockets owned by this instance.
        webSocketHandler.closeUserSessions(event.userId());
        try {
            messageBroker.publish(CHANNEL, event.userId());
        } catch (RuntimeException exception) {
            // The database credential cutoff has already committed, so reconnects and HTTP
            // requests remain blocked even if another instance cannot receive this best-effort
            // immediate-close signal while Redis is unavailable.
            log.warn("Could not broadcast administrative sign-out for user [{}]",
                    event.userId(), exception);
        }
    }
}
