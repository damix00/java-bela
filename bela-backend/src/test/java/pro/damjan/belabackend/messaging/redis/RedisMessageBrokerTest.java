package pro.damjan.belabackend.messaging.redis;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.listener.ChannelTopic;
import org.springframework.data.redis.listener.RedisMessageListenerContainer;
import pro.damjan.belabackend.messaging.MessageListener;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class RedisMessageBrokerTest {

    @Mock
    private StringRedisTemplate redisTemplate;

    @Mock
    private RedisMessageListenerContainer listenerContainer;

    private RedisMessageBroker redisMessageBroker;

    @BeforeEach
    void setUp() {
        redisMessageBroker = new RedisMessageBroker(redisTemplate, listenerContainer);
    }

    // --- publish ---

    @Test
    void publish_sendsMessageViaRedisTemplate() {
        redisMessageBroker.publish("channel-1", "hello");

        verify(redisTemplate).convertAndSend("channel-1", "hello");
    }

    // --- subscribe ---

    @Test
    void subscribe_registersListenerWithContainer() {
        MessageListener listener = (channel, message) -> {};

        redisMessageBroker.subscribe("channel-1", listener);

        verify(listenerContainer).addMessageListener(
                any(org.springframework.data.redis.connection.MessageListener.class),
                eq(new ChannelTopic("channel-1"))
        );
    }

    @Test
    void subscribe_delegatesToAppListener() {
        MessageListener listener = mock(MessageListener.class);

        redisMessageBroker.subscribe("channel-1", listener);

        // Capture the Redis listener that was registered
        ArgumentCaptor<org.springframework.data.redis.connection.MessageListener> captor =
                ArgumentCaptor.forClass(org.springframework.data.redis.connection.MessageListener.class);
        verify(listenerContainer).addMessageListener(captor.capture(), any(ChannelTopic.class));

        // Simulate a Redis message
        org.springframework.data.redis.connection.MessageListener redisListener = captor.getValue();
        org.springframework.data.redis.connection.Message redisMessage = mock(org.springframework.data.redis.connection.Message.class);
        when(redisMessage.getBody()).thenReturn("payload".getBytes());
        when(redisMessage.getChannel()).thenReturn("channel-1".getBytes());

        redisListener.onMessage(redisMessage, null);

        verify(listener).onMessage("channel-1", "payload");
    }

    // --- unsubscribe ---

    @Test
    void unsubscribe_removesListenerFromContainer() {
        MessageListener listener = (channel, message) -> {};
        redisMessageBroker.subscribe("channel-1", listener);

        redisMessageBroker.unsubscribe("channel-1");

        verify(listenerContainer).removeMessageListener(
                any(org.springframework.data.redis.connection.MessageListener.class),
                eq(new ChannelTopic("channel-1"))
        );
    }

    @Test
    void unsubscribe_doesNothingWhenChannelNotSubscribed() {
        redisMessageBroker.unsubscribe("unknown-channel");

        verify(listenerContainer, never()).removeMessageListener(any(), any(ChannelTopic.class));
    }
}

