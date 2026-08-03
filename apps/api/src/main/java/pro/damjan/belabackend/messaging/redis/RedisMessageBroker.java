package pro.damjan.belabackend.messaging.redis;

import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Primary;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.listener.ChannelTopic;
import org.springframework.data.redis.listener.RedisMessageListenerContainer;
import org.springframework.stereotype.Component;
import pro.damjan.belabackend.messaging.MessageBroker;
import pro.damjan.belabackend.messaging.MessageListener;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Slf4j
@Component
@Primary
public class RedisMessageBroker implements MessageBroker {

    private final StringRedisTemplate redisTemplate;
    private final RedisMessageListenerContainer listenerContainer;
    private final Map<String, org.springframework.data.redis.connection.MessageListener> activeListeners = new ConcurrentHashMap<>();

    public RedisMessageBroker(StringRedisTemplate redisTemplate,
                              RedisMessageListenerContainer listenerContainer) {
        this.redisTemplate = redisTemplate;
        this.listenerContainer = listenerContainer;
    }

    @Override
    public void publish(String channel, String message) {
        log.debug("Publishing to channel [{}]: {}", channel, message);
        redisTemplate.convertAndSend(channel, message);
    }

    @Override
    public void subscribe(String channel, MessageListener listener) {
        log.debug("Subscribing to channel [{}]", channel);

        org.springframework.data.redis.connection.MessageListener redisListener =
                (redisMessage, pattern) -> {
                    String body = new String(redisMessage.getBody());
                    String ch = new String(redisMessage.getChannel());
                    listener.onMessage(ch, body);
                };

        activeListeners.put(channel, redisListener);
        listenerContainer.addMessageListener(redisListener, new ChannelTopic(channel));
    }

    @Override
    public void unsubscribe(String channel) {
        log.debug("Unsubscribing from channel [{}]", channel);

        org.springframework.data.redis.connection.MessageListener redisListener = activeListeners.remove(channel);
        if (redisListener != null) {
            listenerContainer.removeMessageListener(redisListener, new ChannelTopic(channel));
        }
    }
}

