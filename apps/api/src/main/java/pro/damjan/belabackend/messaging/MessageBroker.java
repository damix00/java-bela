package pro.damjan.belabackend.messaging;

public interface MessageBroker {

    /**
     * Publish a message to a specific channel.
     *
     * @param channel the channel/topic to publish to (e.g. "user:{userId}")
     * @param message the message payload
     */
    void publish(String channel, String message);

    /**
     * Subscribe a listener to a specific channel.
     *
     * @param channel  the channel/topic to subscribe to
     * @param listener callback invoked when a message arrives on that channel
     */
    void subscribe(String channel, MessageListener listener);

    /**
     * Unsubscribe from a specific channel.
     *
     * @param channel the channel/topic to unsubscribe from
     */
    void unsubscribe(String channel);
}
