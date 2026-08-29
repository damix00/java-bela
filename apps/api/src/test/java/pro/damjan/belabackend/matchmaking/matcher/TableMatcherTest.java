package pro.damjan.belabackend.matchmaking.matcher;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import pro.damjan.belabackend.matchmaking.MatchedLobby;
import pro.damjan.belabackend.matchmaking.MatchedTable;
import pro.damjan.belabackend.matchmaking.ticket.MatchmakingTicket;
import pro.damjan.belabackend.matchmaking.ticket.TicketShape;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;

class TableMatcherTest {

    private static final Instant START = Instant.parse("2026-08-29T12:00:00Z");

    private TableMatcher matcher;

    @BeforeEach
    void setUp() {
        matcher = new TableMatcher();
    }

    /** Tickets in the order given, each one second newer than the last. */
    private Map<TicketShape, List<MatchmakingTicket>> queueOf(TicketShape... shapes) {
        Map<TicketShape, List<MatchmakingTicket>> buckets = new EnumMap<>(TicketShape.class);

        for (int i = 0; i < shapes.length; i++) {
            buckets.computeIfAbsent(shapes[i], ignored -> new ArrayList<>())
                    .add(new MatchmakingTicket("lobby-" + i, shapes[i], START.plusSeconds(i)));
        }

        return buckets;
    }

    private List<String> lobbyIds(MatchedTable table) {
        return table.lobbies().stream().map(MatchedLobby::lobbyId).toList();
    }

    /** Total seats each team receives, which must be two and two for a real table. */
    private int[] teamSizes(MatchedTable table, Map<TicketShape, List<MatchmakingTicket>> buckets) {
        int[] teams = new int[2];

        for (MatchedLobby seated : table.lobbies()) {
            TicketShape shape = buckets.values().stream()
                    .flatMap(List::stream)
                    .filter(ticket -> ticket.lobbyId().equals(seated.lobbyId()))
                    .findFirst()
                    .orElseThrow()
                    .shape();

            teams[0] += seated.flipped() ? shape.minor() : shape.major();
            teams[1] += seated.flipped() ? shape.major() : shape.minor();
        }

        return teams;
    }

    @Test
    void anEmptyQueueMatchesNothing() {
        assertThat(matcher.match(Map.of())).isEmpty();
    }

    @Test
    void oneWaitingLobbyIsNotATable() {
        assertThat(matcher.match(queueOf(TicketShape.PAIR))).isEmpty();
    }

    @Test
    void twoPairsTakeATeamEach() {
        Map<TicketShape, List<MatchmakingTicket>> buckets = queueOf(TicketShape.PAIR, TicketShape.PAIR);

        MatchedTable table = matcher.match(buckets).orElseThrow();

        assertThat(lobbyIds(table)).containsExactlyInAnyOrder("lobby-0", "lobby-1");
        assertThat(teamSizes(table, buckets)).containsExactly(2, 2);
    }

    @Test
    void aPairIsCompletedByTwoSolos() {
        Map<TicketShape, List<MatchmakingTicket>> buckets =
                queueOf(TicketShape.PAIR, TicketShape.SOLO, TicketShape.SOLO);

        MatchedTable table = matcher.match(buckets).orElseThrow();

        assertThat(lobbyIds(table)).hasSize(3);
        assertThat(teamSizes(table, buckets)).containsExactly(2, 2);
    }

    @Test
    void aTrioIsCompletedByASolo() {
        Map<TicketShape, List<MatchmakingTicket>> buckets = queueOf(TicketShape.TRIO, TicketShape.SOLO);

        MatchedTable table = matcher.match(buckets).orElseThrow();

        assertThat(lobbyIds(table)).containsExactlyInAnyOrder("lobby-0", "lobby-1");
        assertThat(teamSizes(table, buckets)).containsExactly(2, 2);
    }

    @Test
    void fourSolosFillATable() {
        Map<TicketShape, List<MatchmakingTicket>> buckets = queueOf(
                TicketShape.SOLO, TicketShape.SOLO, TicketShape.SOLO, TicketShape.SOLO);

        MatchedTable table = matcher.match(buckets).orElseThrow();

        assertThat(lobbyIds(table)).hasSize(4);
        assertThat(teamSizes(table, buckets)).containsExactly(2, 2);
    }

    @Test
    void twoSplitsFillATable() {
        Map<TicketShape, List<MatchmakingTicket>> buckets = queueOf(TicketShape.SPLIT, TicketShape.SPLIT);

        MatchedTable table = matcher.match(buckets).orElseThrow();

        assertThat(teamSizes(table, buckets)).containsExactly(2, 2);
    }

    @Test
    void aPairAndASplitNeverShareATable() {
        assertThat(matcher.match(queueOf(TicketShape.PAIR, TicketShape.SPLIT))).isEmpty();
    }

    @Test
    void aTrioWaitsWhenOnlyAPairIsAvailable() {
        assertThat(matcher.match(queueOf(TicketShape.TRIO, TicketShape.PAIR))).isEmpty();
    }

    @Test
    void theLongestWaitingLobbyIsAlwaysSeated() {
        // The trio has waited longest, so the table has to include it even though the three solos
        // behind it could have formed a table of their own.
        Map<TicketShape, List<MatchmakingTicket>> buckets = new EnumMap<>(TicketShape.class);
        buckets.put(TicketShape.TRIO, List.of(
                new MatchmakingTicket("trio", TicketShape.TRIO, START)));
        buckets.put(TicketShape.SOLO, List.of(
                new MatchmakingTicket("solo-a", TicketShape.SOLO, START.plusSeconds(10)),
                new MatchmakingTicket("solo-b", TicketShape.SOLO, START.plusSeconds(11)),
                new MatchmakingTicket("solo-c", TicketShape.SOLO, START.plusSeconds(12)),
                new MatchmakingTicket("solo-d", TicketShape.SOLO, START.plusSeconds(13))));

        MatchedTable table = matcher.match(buckets).orElseThrow();

        assertThat(lobbyIds(table)).contains("trio");
    }

    @Test
    void theOldestTicketsOfAShapeAreTakenFirst() {
        Map<TicketShape, List<MatchmakingTicket>> buckets = new EnumMap<>(TicketShape.class);
        buckets.put(TicketShape.PAIR, List.of(
                new MatchmakingTicket("oldest", TicketShape.PAIR, START),
                new MatchmakingTicket("newer", TicketShape.PAIR, START.plusSeconds(5))));

        MatchedTable table = matcher.match(buckets).orElseThrow();

        assertThat(lobbyIds(table)).containsExactlyInAnyOrder("oldest", "newer");
    }

    @Test
    void everyRecipeProducesASeatableTable() {
        for (TableRecipe recipe : TableRecipe.values()) {
            List<TicketShape> shapes = new ArrayList<>();
            recipe.counts().forEach((shape, count) -> {
                for (int i = 0; i < count; i++) shapes.add(shape);
            });

            Map<TicketShape, List<MatchmakingTicket>> buckets =
                    queueOf(shapes.toArray(TicketShape[]::new));

            Optional<MatchedTable> table = matcher.match(buckets);

            assertThat(table).as("%s produced no table", recipe).isPresent();
            assertThat(teamSizes(table.get(), buckets))
                    .as("%s did not fill both teams", recipe)
                    .containsExactly(2, 2);
        }
    }

    @Test
    void aQueueOfOnlyIncompatibleShapesNeverMatches() {
        // Trios can only be completed by solos, so any number of them alone go nowhere.
        Map<TicketShape, List<MatchmakingTicket>> buckets = new EnumMap<>(TicketShape.class);
        buckets.put(TicketShape.TRIO, List.of(
                new MatchmakingTicket("trio-a", TicketShape.TRIO, START),
                new MatchmakingTicket("trio-b", TicketShape.TRIO, START.plusSeconds(1))));

        assertThat(matcher.match(buckets)).isEmpty();
    }

    @Test
    void everyMatchedTableHoldsExactlyFourPlayers() {
        for (TableRecipe recipe : TableRecipe.values()) {
            List<TicketShape> shapes = new ArrayList<>();
            recipe.counts().forEach((shape, count) -> {
                for (int i = 0; i < count; i++) shapes.add(shape);
            });

            Map<TicketShape, List<MatchmakingTicket>> buckets =
                    queueOf(shapes.toArray(TicketShape[]::new));
            MatchedTable table = matcher.match(buckets).orElseThrow();

            int players = Arrays.stream(teamSizes(table, buckets)).sum();
            assertThat(players).as("%s", recipe).isEqualTo(4);
        }
    }
}
