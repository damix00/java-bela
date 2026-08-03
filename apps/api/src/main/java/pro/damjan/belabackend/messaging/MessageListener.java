package pro.damjan.belabackend.messaging;

/**
 * Functional interface for handling messages received from a {@link MessageBroker}.
 */
@FunctionalInterface
public interface MessageListener {

    /**
     * Called when a message is received on the subscribed channel.
     *
     * @param channel the channel the message was received on
     * @param message the message payload
     */
    void onMessage(String channel, String message);
}
