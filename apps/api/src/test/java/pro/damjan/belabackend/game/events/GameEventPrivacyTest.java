package pro.damjan.belabackend.game.events;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import pro.damjan.belabackend.game.events.dto.outgoing.DeclarationsRevealedEvent;
import pro.damjan.belabackend.game.model.BeloteGame;
import pro.damjan.belabackend.game.model.GameStatus;
import pro.damjan.belabackend.game.model.card.Card;
import pro.damjan.belabackend.game.model.card.Rank;
import pro.damjan.belabackend.game.model.card.Suite;
import pro.damjan.belabackend.game.model.config.GameConfiguration;
import pro.damjan.belabackend.game.model.player.GamePlayer;
import pro.damjan.belabackend.game.model.player.Team;
import pro.damjan.belabackend.game.model.player.TeamPair;
import pro.damjan.belabackend.game.scheduling.registry.ScheduledTaskRegistry;
import pro.damjan.belabackend.game.service.access.GameAccessService;
import pro.damjan.belabackend.game.service.play.CardPlayService;
import pro.damjan.belabackend.game.service.play.GameFlowService;
import pro.damjan.belabackend.game.service.play.TrumpPhaseService;
import pro.damjan.belabackend.websocket.events.WebSocketPublisher;
import pro.damjan.belabackend.websocket.events.dto.OutgoingEvent;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

/**
 * What is allowed to leave the server, asserted against the bytes rather than against getters.
 *
 * <p>The rule every outbound game payload has to satisfy: the cards in a payload addressed to
 * player P are a subset of P's own non-hidden hand, the cards played to the current trick, and the
 * declaration cards the reveal has made public. Nothing else — no hidden card of any seat, P's own
 * included, before it is revealed to them.
 *
 * <p>The tests walk the serialized JSON for anything shaped like a card, so a field added to any
 * DTO later is caught here instead of being quietly trusted.
 */
class GameEventPrivacyTest {

    private record Sent(String userId, OutgoingEvent event, JsonNode payload) {}

    private static final ObjectMapper MAPPER = new ObjectMapper();

    private WebSocketPublisher webSocketPublisher;
    private GameAccessService gameAccessService;
    private ScheduledTaskRegistry scheduledTaskRegistry;
    private CardPlayService cardPlayService;
    private BeloteGameEventPublisher publisher;
    private TrumpPhaseService trumpPhaseService;
    private List<Sent> sent;

    @BeforeEach
    void setUp() {
        sent = new ArrayList<>();
        webSocketPublisher = mock(WebSocketPublisher.class);
        doAnswer(invocation -> {
            String userId = invocation.getArgument(0);
            OutgoingEvent event = invocation.getArgument(1);
            sent.add(new Sent(userId, event, MAPPER.valueToTree(event)));
            return null;
        }).when(webSocketPublisher).sendToActiveSession(org.mockito.ArgumentMatchers.anyString(), org.mockito.ArgumentMatchers.any());

        gameAccessService = mock(GameAccessService.class);
        scheduledTaskRegistry = mock(ScheduledTaskRegistry.class);
        cardPlayService = mock(CardPlayService.class);
        publisher = new BeloteGameEventPublisher(webSocketPublisher, scheduledTaskRegistry);
        trumpPhaseService = new TrumpPhaseService(
                gameAccessService,
                publisher,
                scheduledTaskRegistry,
                cardPlayService,
                new GameFlowService(gameAccessService, publisher, scheduledTaskRegistry)
        );
    }

    @Test
    void roundStartSendsEachPlayerTheirOwnSixCardsAndNobodyElsesAnything() {
        BeloteGame game = dealtGame();

        publisher.roundStarted(game);

        assertThat(sent).hasSize(4);
        for (Sent message : sent) {
            assertOnlySees(message, visibleHandOf(game, message.userId()));
        }
    }

    @Test
    void theTwoFaceDownCardsAreInNobodysRoundStart() {
        BeloteGame game = dealtGame();

        publisher.roundStarted(game);

        Set<String> hiddenEverywhere = new LinkedHashSet<>();
        for (GamePlayer player : game.getPlayers()) {
            player.getHand().stream().filter(Card::isHidden).forEach(card -> hiddenEverywhere.add(key(card)));
        }
        assertThat(hiddenEverywhere).hasSize(8);
        for (Sent message : sent) {
            assertThat(cardsIn(message.payload())).doesNotContainAnyElementsOf(hiddenEverywhere);
        }
    }

    @Test
    void passingRevealsTheTwoCardsToThePasserAndToNobodyElse() {
        BeloteGame game = dealtGame();
        when(gameAccessService.requireUserGame("p0")).thenReturn(game);

        trumpPhaseService.passTrump("p0");

        assertThat(sent).hasSize(4);
        for (Sent message : sent) {
            // The passer now legitimately holds eight; everyone else is still on six, and none of
            // those six may be a card the passer just turned over.
            assertOnlySees(message, message.userId().equals("p0")
                    ? handOf(game, "p0")
                    : visibleHandOf(game, message.userId()));
        }

        Set<String> revealed = sent.stream()
                .filter(message -> message.userId().equals("p0"))
                .flatMap(message -> cardsIn(message.payload()).stream())
                .collect(java.util.stream.Collectors.toCollection(LinkedHashSet::new));
        assertThat(revealed).hasSize(2);
        for (Sent message : sent) {
            if (message.userId().equals("p0")) continue;
            assertThat(cardsIn(message.payload())).isEmpty();
        }
    }

    @Test
    void aPassDoesNotTurnOverAnybodyElsesCards() {
        BeloteGame game = dealtGame();
        when(gameAccessService.requireUserGame("p0")).thenReturn(game);

        trumpPhaseService.passTrump("p0");

        assertThat(game.getPlayer(0).getHand()).noneMatch(Card::isHidden);
        for (int seat = 1; seat < 4; seat++) {
            assertThat(game.getPlayer(seat).getHand()).filteredOn(Card::isHidden).hasSize(2);
        }
    }

    @Test
    void theAskCarriesOnlyYourOwnHandAndYourOwnZvanja() {
        BeloteGame game = dealtGame();
        game.getPlayer(1).receiveCards(fourJacks());
        when(gameAccessService.requireUserGame("p0")).thenReturn(game);

        trumpPhaseService.chooseTrump("p0", Suite.HEARTS);

        assertThat(sent).hasSize(4);
        for (Sent message : sent) {
            assertOnlySees(message, handOf(game, message.userId()));
            JsonNode data = message.payload();
            assertThat(data.get("team1Declarations")).isEmpty();
            assertThat(data.get("team2Declarations")).isEmpty();
        }

        // p1 is the only seat told about p1's four jacks.
        assertThat(payloadFor("p1").get("myDeclarations")).hasSize(1);
        for (String userId : List.of("p0", "p2", "p3")) {
            assertThat(payloadFor(userId).get("myDeclarations")).isEmpty();
        }
    }

    @Test
    void aSnapshotMidAskWithholdsTheContestAndWhoDeclined() {
        BeloteGame game = askingGame();
        when(gameAccessService.requireUserGame("p1")).thenReturn(game);

        // p1 declines: the broadcast that follows must not say so, and must not say what p1 held.
        trumpPhaseService.answerDeclarations("p1", false);

        assertThat(sent).isNotEmpty();
        for (Sent message : sent) {
            assertOnlySees(message, handOf(game, message.userId()));
            JsonNode round = message.payload().get("currentRound");
            assertThat(round.get("roundStatus").asString()).isEqualTo("DECLARING");
            assertThat(round.get("team1Declarations")).isEmpty();
            assertThat(round.get("team2Declarations")).isEmpty();
            assertThat(round.get("declinedDeclarationSeats")).isEmpty();
            // Who the table is waiting on is all it may say.
            assertThat(round.get("answeredDeclarationSeats")).hasSize(1);
        }
    }

    @Test
    void theAskDoesNotLeakTheContestThroughTheRunningScore() {
        // Blanking the declaration lists is not enough on its own: the round score is cards plus
        // zvanja, so a table that had been asked nothing yet was still reading "+60" for the side
        // holding them.
        BeloteGame game = dealtGame();
        game.getPlayer(1).receiveCards(fourJacks());
        when(gameAccessService.requireUserGame("p0")).thenReturn(game);

        trumpPhaseService.chooseTrump("p0", Suite.HEARTS);

        for (Sent message : sent) {
            assertThat(message.payload().get("team1RoundPoints").asInt()).isZero();
            assertThat(message.payload().get("team2RoundPoints").asInt()).isZero();
        }
    }

    @Test
    void aSnapshotMidAskKeepsTheContestOutOfTheScoreToo() {
        BeloteGame game = askingGame();
        when(gameAccessService.requireUserGame("p1")).thenReturn(game);

        trumpPhaseService.answerDeclarations("p1", true);

        for (Sent message : sent) {
            JsonNode round = message.payload().get("currentRound");
            assertThat(round.get("team1RoundPoints").asInt()).isZero();
            assertThat(round.get("team2RoundPoints").asInt()).isZero();
        }
    }

    @Test
    void theRevealIsWhenTheScoreStartsCountingTheZvanja() {
        BeloteGame game = askingGame();
        for (String userId : List.of("p0", "p1", "p2", "p3")) {
            when(gameAccessService.requireUserGame(userId)).thenReturn(game);
            trumpPhaseService.answerDeclarations(userId, true);
        }

        assertThat(game.getCurrentRound().getTeam2RoundScore()).isEqualTo(200);
        List<Sent> reveals = sent.stream()
                .filter(message -> message.event() instanceof DeclarationsRevealedEvent)
                .toList();
        assertThat(reveals).hasSize(4);
    }

    @Test
    void aSnapshotMidAskStillTellsEachPlayerTheirOwnZvanja() {
        BeloteGame game = askingGame();
        when(gameAccessService.requireUserGame("p1")).thenReturn(game);

        trumpPhaseService.answerDeclarations("p1", true);

        assertThat(payloadFor("p1").get("currentRound").get("myDeclarations")).hasSize(1);
        for (String userId : List.of("p0", "p2", "p3")) {
            assertThat(payloadFor(userId).get("currentRound").get("myDeclarations")).isEmpty();
        }
    }

    @Test
    void theRevealShowsTheSameDeclaredCardsToEveryone() {
        BeloteGame game = askingGame();
        for (String userId : List.of("p0", "p1", "p2", "p3")) {
            when(gameAccessService.requireUserGame(userId)).thenReturn(game);
        }
        for (String userId : List.of("p0", "p1", "p2", "p3")) {
            trumpPhaseService.answerDeclarations(userId, true);
        }

        List<Sent> reveals = sent.stream()
                .filter(message -> message.event() instanceof DeclarationsRevealedEvent)
                .toList();
        assertThat(reveals).hasSize(4);

        Set<String> declared = cardsIn(reveals.getFirst().payload());
        assertThat(declared).hasSize(4); // p1's four jacks, now public
        for (Sent message : reveals) {
            assertThat(cardsIn(message.payload())).isEqualTo(declared);
        }
    }

    @Test
    void theRevealNeverCarriesACardThatWasNotDeclared() {
        BeloteGame game = askingGame();
        for (String userId : List.of("p0", "p1", "p2", "p3")) {
            when(gameAccessService.requireUserGame(userId)).thenReturn(game);
            trumpPhaseService.answerDeclarations(userId, true);
        }

        Set<String> declaredCards = new LinkedHashSet<>();
        game.getCurrentRound().getDeclarations(0).forEach(d -> d.getCards().forEach(c -> declaredCards.add(key(c))));
        game.getCurrentRound().getDeclarations(1).forEach(d -> d.getCards().forEach(c -> declaredCards.add(key(c))));

        for (Sent message : sent) {
            Set<String> allowed = new LinkedHashSet<>(declaredCards);
            allowed.addAll(handOf(game, message.userId()));
            assertThat(cardsIn(message.payload())).isSubsetOf(allowed);
        }
    }

    @Test
    void playSnapshotsCarryOnlyYourOwnHand() {
        BeloteGame game = askingGame();
        when(gameAccessService.requireUserGame("p0")).thenReturn(game);
        when(gameAccessService.requireGameById("game-1")).thenReturn(game);
        for (String userId : List.of("p0", "p1", "p2", "p3")) {
            when(gameAccessService.requireUserGame(userId)).thenReturn(game);
            trumpPhaseService.answerDeclarations(userId, false);
        }
        sent.clear();

        publisher.broadcastSnapshot(game);

        assertThat(sent).hasSize(4);
        for (Sent message : sent) {
            assertOnlySees(message, handOf(game, message.userId()));
        }
    }

    @Test
    void aBelotEndsTheRoundAndIsTheOneHandEveryoneMaySee() {
        BeloteGame game = dealtGame();
        game.getPlayer(0).receiveCards(List.of(
                card(Suite.HEARTS, Rank.SEVEN), card(Suite.HEARTS, Rank.EIGHT),
                card(Suite.HEARTS, Rank.NINE), card(Suite.HEARTS, Rank.TEN),
                card(Suite.HEARTS, Rank.JACK), card(Suite.HEARTS, Rank.QUEEN),
                hidden(Suite.HEARTS, Rank.KING), hidden(Suite.HEARTS, Rank.ACE)
        ));
        when(gameAccessService.requireUserGame("p0")).thenReturn(game);

        trumpPhaseService.chooseTrump("p0", Suite.HEARTS);

        Set<String> belot = new LinkedHashSet<>(handOf(game, "p0"));
        for (Sent message : sent) {
            Set<String> allowed = new LinkedHashSet<>(belot);
            allowed.addAll(handOf(game, message.userId()));
            assertThat(cardsIn(message.payload())).isSubsetOf(allowed);
        }
    }

    /**
     * The strongest form of the rule, and the one that catches what a card-walk cannot: nothing a
     * player is sent during the ask may *depend* on anyone else's hand. Run the same round twice,
     * changing only what p1 holds, and every byte addressed to the other three has to match. This
     * is what would have caught the running score — identical for all four recipients, so symmetry
     * said nothing, but plainly a function of the zvanja p1 was sitting on.
     */
    @Test
    void nothingInTheAskDependsOnWhatAnyoneElseHolds() {
        List<Sent> withZvanja = askPayloads(handWithFourJacks());
        List<Sent> without = askPayloads(junkHand());

        assertZvanjaActuallyDiffer(withZvanja, without);
        assertPayloadsMatchFor(List.of("p0", "p2", "p3"), withZvanja, without);
    }

    @Test
    void nothingInAMidAskSnapshotDependsOnWhatAnyoneElseHolds() {
        List<Sent> withZvanja = midAskSnapshotPayloads(handWithFourJacks());
        List<Sent> without = midAskSnapshotPayloads(junkHand());

        assertPayloadsMatchFor(List.of("p0", "p2", "p3"), withZvanja, without);
    }

    @Test
    void nothingInAPassDependsOnTheCardsItTurnedOver() {
        List<Sent> one = passPayloads(List.of(card(Suite.HEARTS, Rank.KING), card(Suite.HEARTS, Rank.QUEEN)));
        List<Sent> other = passPayloads(List.of(card(Suite.LEAF, Rank.SEVEN), card(Suite.ACORN, Rank.EIGHT)));

        assertPayloadsMatchFor(List.of("p1", "p2", "p3"), one, other);
    }

    @Test
    void theDealGivesNoTwoSeatsTheSameCard() {
        // Everything above reads "whose card is this?" off the card itself, so the fixture has to
        // keep that question answerable.
        BeloteGame game = dealtGame();

        Set<String> all = new LinkedHashSet<>();
        int dealt = 0;
        for (GamePlayer player : game.getPlayers()) {
            assertThat(player.getHand()).hasSize(8);
            for (Card card : player.getHand()) {
                all.add(key(card));
                dealt++;
            }
        }

        assertThat(dealt).isEqualTo(32);
        assertThat(all).hasSize(32);
    }

    // ---- helpers -------------------------------------------------------------------------

    /**
     * The comparison is only worth anything if the two runs really do differ, so this asserts the
     * premise: p1 held zvanja in one and nothing in the other. Without it, a control hand that
     * quietly grew a declaration (four nines is 150) would turn the whole test green for free.
     */
    private void assertZvanjaActuallyDiffer(List<Sent> withZvanja, List<Sent> without) {
        assertThat(payloadsFor(withZvanja, "p1").getFirst().get("myDeclarations")).isNotEmpty();
        assertThat(payloadsFor(without, "p1").getFirst().get("myDeclarations")).isEmpty();
    }

    /** The same events, replayed for a different holding: what each of these seats saw must not move. */
    private void assertPayloadsMatchFor(List<String> userIds, List<Sent> first, List<Sent> second) {
        assertThat(first).hasSameSizeAs(second);

        for (String userId : userIds) {
            List<JsonNode> a = payloadsFor(first, userId);
            List<JsonNode> b = payloadsFor(second, userId);

            assertThat(a).as("payloads to %s", userId).isNotEmpty();
            assertThat(a).as("what %s was sent", userId).isEqualTo(b);
        }
    }

    private List<JsonNode> payloadsFor(List<Sent> messages, String userId) {
        return messages.stream()
                .filter(message -> message.userId().equals(userId))
                .map(Sent::payload)
                .toList();
    }

    /** The ask, as it goes out, with p1 holding whatever is handed in. */
    private List<Sent> askPayloads(List<Card> p1Hand) {
        setUp();
        BeloteGame game = dealtGame();
        game.getPlayer(1).receiveCards(p1Hand);
        when(gameAccessService.requireUserGame("p0")).thenReturn(game);

        trumpPhaseService.chooseTrump("p0", Suite.HEARTS);
        return List.copyOf(sent);
    }

    /** The broadcast an answer triggers, mid-ask. */
    private List<Sent> midAskSnapshotPayloads(List<Card> p1Hand) {
        setUp();
        BeloteGame game = dealtGame();
        game.getPlayer(1).receiveCards(p1Hand);
        when(gameAccessService.requireUserGame("p0")).thenReturn(game);
        trumpPhaseService.chooseTrump("p0", Suite.HEARTS);
        sent.clear();

        trumpPhaseService.answerDeclarations("p0", true);
        return List.copyOf(sent);
    }

    /** A pass, with the passer sitting on whichever two cards it turns over. */
    private List<Sent> passPayloads(List<Card> hiddenPair) {
        setUp();
        BeloteGame game = dealtGame();
        List<Card> hand = new ArrayList<>(game.getPlayer(0).getHand().stream()
                .filter(card -> !card.isHidden())
                .toList());
        for (Card card : hiddenPair) {
            card.setHidden(true);
            hand.add(card);
        }
        game.getPlayer(0).receiveCards(hand);
        when(gameAccessService.requireUserGame("p0")).thenReturn(game);

        trumpPhaseService.passTrump("p0");
        return List.copyOf(sent);
    }

    /**
     * Eight cards holding four jacks and nothing else — same size as {@link #junkHand()}, so the
     * two runs differ in what p1 holds and in nothing else, card counts included.
     */
    private List<Card> handWithFourJacks() {
        return List.of(
                card(Suite.HEARTS, Rank.JACK), card(Suite.BELLS, Rank.JACK),
                card(Suite.ACORN, Rank.JACK), card(Suite.LEAF, Rank.JACK),
                card(Suite.HEARTS, Rank.SEVEN), card(Suite.BELLS, Rank.EIGHT),
                card(Suite.ACORN, Rank.NINE), card(Suite.LEAF, Rank.TEN)
        );
    }

    /** Eight cards that make no zvanja at all — two of each suite, never adjacent. */
    private List<Card> junkHand() {
        // No rank four times over (four nines is 150, which would make this no control at all) and
        // never two of a suit in a row.
        return List.of(
                card(Suite.HEARTS, Rank.SEVEN), card(Suite.HEARTS, Rank.NINE),
                card(Suite.BELLS, Rank.EIGHT), card(Suite.BELLS, Rank.TEN),
                card(Suite.ACORN, Rank.JACK), card(Suite.ACORN, Rank.KING),
                card(Suite.LEAF, Rank.QUEEN), card(Suite.LEAF, Rank.ACE)
        );
    }

    /** Every payload addressed to this player may show these cards and no others. */
    private void assertOnlySees(Sent message, Set<String> allowed) {
        assertThat(cardsIn(message.payload()))
                .as("cards sent to %s", message.userId())
                .isSubsetOf(allowed);
    }

    private JsonNode payloadFor(String userId) {
        return sent.stream()
                .filter(message -> message.userId().equals(userId))
                .reduce((first, second) -> second)
                .orElseThrow()
                .payload();
    }

    /** Anything in the JSON shaped like a card, wherever in the tree it turns up. */
    private Set<String> cardsIn(JsonNode node) {
        Set<String> cards = new LinkedHashSet<>();
        collectCards(node, cards);
        return cards;
    }

    private void collectCards(JsonNode node, Set<String> cards) {
        if (node == null || node.isNull()) {
            return;
        }
        if (node.isObject() && node.has("suite") && node.has("rank")) {
            cards.add(node.get("suite").asString() + "-" + node.get("rank").asString());
        }
        node.values().forEach(child -> collectCards(child, cards));
    }

    private Set<String> handOf(BeloteGame game, String userId) {
        return keys(playerOf(game, userId).getHand().stream());
    }

    private Set<String> visibleHandOf(BeloteGame game, String userId) {
        return keys(playerOf(game, userId).getHand().stream().filter(card -> !card.isHidden()));
    }

    private GamePlayer playerOf(BeloteGame game, String userId) {
        return game.getPlayers().stream()
                .filter(player -> player.getUserId().equals(userId))
                .findFirst()
                .orElseThrow();
    }

    private Set<String> keys(java.util.stream.Stream<Card> cards) {
        return cards.map(this::key).collect(java.util.stream.Collectors.toCollection(LinkedHashSet::new));
    }

    private String key(Card card) {
        return card.getSuite().name() + "-" + card.getRank().name();
    }

    /** A table mid-ask: trump called, p1 sitting on four jacks, nobody has answered yet. */
    private BeloteGame askingGame() {
        BeloteGame game = dealtGame();
        game.getPlayer(1).receiveCards(fourJacks());
        when(gameAccessService.requireUserGame("p0")).thenReturn(game);
        trumpPhaseService.chooseTrump("p0", Suite.BELLS);
        sent.clear();
        return game;
    }

    private List<Card> fourJacks() {
        return List.of(
                card(Suite.HEARTS, Rank.JACK),
                card(Suite.BELLS, Rank.JACK),
                card(Suite.ACORN, Rank.JACK),
                card(Suite.LEAF, Rank.JACK)
        );
    }

    /**
     * Four seats, eight cards each, no two seats holding the same card — so a card appearing in a
     * payload names its owner. The deal is round-robin off a suite-ordered deck, which happens to
     * leave nobody holding zvanja; the tests that need some hand them out explicitly.
     */
    private BeloteGame dealtGame() {
        List<GamePlayer> players = List.of(
                new GamePlayer("p0", 0, false),
                new GamePlayer("p1", 1, false),
                new GamePlayer("p2", 2, false),
                new GamePlayer("p3", 3, false)
        );
        TeamPair teams = Team.pairFrom(players);
        BeloteGame game = BeloteGame.builder()
                .id("game-1")
                .team1(teams.teamA())
                .team2(teams.teamB())
                .config(GameConfiguration.ranked())
                .status(GameStatus.IN_PROGRESS)
                .build();
        game.createNewRound();

        // Two cards of each suite per seat, staggered by seat: two of a suite cannot make a
        // sequence and no rank lands in all four suites at one seat, so the deal is quiet.
        Rank[] ranks = Rank.values();
        for (int seat = 0; seat < 4; seat++) {
            List<Card> hand = new ArrayList<>();
            for (Suite suite : Suite.values()) {
                int offset = (2 * seat + suite.ordinal()) % ranks.length;
                hand.add(card(suite, ranks[offset]));
                hand.add(card(suite, ranks[(offset + 1) % ranks.length]));
            }
            hand.get(6).setHidden(true);
            hand.get(7).setHidden(true);
            game.getPlayer(seat).receiveCards(hand);
        }

        return game;
    }

    private Card card(Suite suite, Rank rank) {
        return new Card(suite, rank, false);
    }

    private Card hidden(Suite suite, Rank rank) {
        Card card = card(suite, rank);
        card.setHidden(true);
        return card;
    }
}
