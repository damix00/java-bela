package pro.damjan.belabackend.matchmaking.queue;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.data.redis.connection.lettuce.LettuceConnectionFactory;
import org.springframework.data.redis.core.StringRedisTemplate;
import pro.damjan.belabackend.matchmaking.ticket.MatchmakingTicket;
import pro.damjan.belabackend.matchmaking.ticket.TicketShape;

import java.time.Instant;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assumptions.assumeTrue;

/**
 * Exercises the queue against a real Redis, because what is being relied on here is Redis's own
 * behaviour — sorted sets ordered by score, ZADD replacing by member, ZREM reporting whether it
 * removed anything. A fake would only be asserting this test's idea of those.
 *
 * Skips rather than fails when nothing is listening, so the suite still runs without one.
 */
class MatchmakingQueueTest {

    private static final Instant START = Instant.parse("2026-08-29T12:00:00Z");

    private static LettuceConnectionFactory connectionFactory;
    private static boolean redisAvailable;

    private StringRedisTemplate redisTemplate;
    private MatchmakingQueue queue;

    @BeforeAll
    static void connect() {
        connectionFactory = new LettuceConnectionFactory("localhost", 6379);
        connectionFactory.afterPropertiesSet();

        try {
            connectionFactory.getConnection().ping();
            redisAvailable = true;
        } catch (Exception unavailable) {
            redisAvailable = false;
        }
    }

    @BeforeEach
    void setUp() {
        assumeTrue(redisAvailable, "no Redis on localhost:6379");

        redisTemplate = new StringRedisTemplate(connectionFactory);
        redisTemplate.afterPropertiesSet();
        queue = new MatchmakingQueue(redisTemplate);

        clearBuckets();
    }

    @AfterEach
    void tearDown() {
        if (redisAvailable) clearBuckets();
    }

    private void clearBuckets() {
        for (TicketShape shape : TicketShape.values()) {
            redisTemplate.delete("matchmaking:casual:" + shape.name());
        }
    }

    private MatchmakingTicket ticket(String lobbyId, TicketShape shape, int secondsIn) {
        return new MatchmakingTicket(lobbyId, shape, START.plusSeconds(secondsIn));
    }

    @Test
    void aQueuedTicketComesBackWithEveryFieldIntact() {
        queue.enqueue(ticket("lobby-a", TicketShape.PAIR, 7));

        List<MatchmakingTicket> waiting = queue.peek().get(TicketShape.PAIR);

        assertThat(waiting).containsExactly(ticket("lobby-a", TicketShape.PAIR, 7));
    }

    @Test
    void anEmptyQueuePeeksEmpty() {
        Map<TicketShape, List<MatchmakingTicket>> heads = queue.peek();

        assertThat(heads.values()).allSatisfy(tickets -> assertThat(tickets).isEmpty());
    }

    @Test
    void ticketsComeBackOldestFirst() {
        queue.enqueue(ticket("newest", TicketShape.SOLO, 30));
        queue.enqueue(ticket("oldest", TicketShape.SOLO, 10));
        queue.enqueue(ticket("middle", TicketShape.SOLO, 20));

        assertThat(queue.peek().get(TicketShape.SOLO))
                .extracting(MatchmakingTicket::lobbyId)
                .containsExactly("oldest", "middle", "newest");
    }

    @Test
    void aPeekReadsNoMoreThanTheRecipesCouldUse() {
        for (int i = 0; i < 10; i++) {
            queue.enqueue(ticket("solo-" + i, TicketShape.SOLO, i));
        }

        // Four solos is the most any recipe wants; the rest cannot change the outcome.
        assertThat(queue.peek().get(TicketShape.SOLO)).hasSize(4);
    }

    @Test
    void queueingTheSameLobbyTwiceLeavesOneTicket() {
        queue.enqueue(ticket("lobby-a", TicketShape.SOLO, 5));
        queue.enqueue(ticket("lobby-a", TicketShape.SOLO, 9));

        assertThat(queue.peek().get(TicketShape.SOLO))
                .containsExactly(ticket("lobby-a", TicketShape.SOLO, 9));
    }

    @Test
    void aLobbyThatChangesShapeDoesNotHauntItsOldBucket() {
        queue.enqueue(ticket("lobby-a", TicketShape.PAIR, 5));
        queue.enqueue(ticket("lobby-a", TicketShape.SPLIT, 6));

        assertThat(queue.peek().get(TicketShape.PAIR)).isEmpty();
        assertThat(queue.peek().get(TicketShape.SPLIT)).hasSize(1);
    }

    @Test
    void cancellingRemovesTheTicket() {
        queue.enqueue(ticket("lobby-a", TicketShape.TRIO, 1));

        queue.cancel("lobby-a");

        assertThat(queue.peek().get(TicketShape.TRIO)).isEmpty();
    }

    @Test
    void cancellingALobbyThatWasNeverQueuedDoesNothing() {
        queue.enqueue(ticket("lobby-a", TicketShape.SOLO, 1));

        queue.cancel("never-queued");

        assertThat(queue.peek().get(TicketShape.SOLO)).hasSize(1);
    }

    @Test
    void committingTakesTheTicketsOut() {
        MatchmakingTicket first = ticket("lobby-a", TicketShape.PAIR, 1);
        MatchmakingTicket second = ticket("lobby-b", TicketShape.PAIR, 2);
        queue.enqueue(first);
        queue.enqueue(second);

        assertThat(queue.commit(List.of(first, second))).isTrue();
        assertThat(queue.peek().get(TicketShape.PAIR)).isEmpty();
    }

    @Test
    void committingReportsATicketThatWasAlreadyGone() {
        MatchmakingTicket present = ticket("lobby-a", TicketShape.PAIR, 1);
        MatchmakingTicket vanished = ticket("lobby-b", TicketShape.PAIR, 2);
        queue.enqueue(present);

        assertThat(queue.commit(List.of(present, vanished))).isFalse();
    }

    @Test
    void bucketsDoNotLeakIntoEachOther() {
        queue.enqueue(ticket("solo", TicketShape.SOLO, 1));
        queue.enqueue(ticket("pair", TicketShape.PAIR, 2));

        Map<TicketShape, List<MatchmakingTicket>> heads = queue.peek();

        assertThat(heads.get(TicketShape.SOLO)).extracting(MatchmakingTicket::lobbyId).containsExactly("solo");
        assertThat(heads.get(TicketShape.PAIR)).extracting(MatchmakingTicket::lobbyId).containsExactly("pair");
        assertThat(heads.get(TicketShape.TRIO)).isEmpty();
    }
}
