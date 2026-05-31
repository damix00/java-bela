package pro.damjan.belabackend.game.model.card;

import pro.damjan.belabackend.game.model.player.GamePlayer;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

public final class DeclarationResolver {

    private static final List<Rank> DECLARATION_RANK_ORDER = List.of(
            Rank.ACE,
            Rank.KING,
            Rank.QUEEN,
            Rank.JACK,
            Rank.TEN,
            Rank.NINE,
            Rank.EIGHT,
            Rank.SEVEN
    );

    private DeclarationResolver() {}

    public record Result(
            int winningTeamIndex,
            List<Declaration> team1Declarations,
            List<Declaration> team2Declarations,
            boolean belot
    ) {
        public boolean hasWinningTeam() {
            return winningTeamIndex >= 0;
        }
    }

    private record PlayerDeclarations(
            int playerIndex,
            int teamIndex,
            List<Declaration> declarations
    ) {}

    private record Candidate(
            int playerIndex,
            int teamIndex,
            Declaration declaration
    ) {}

    public static Result resolve(List<GamePlayer> players, int startingPlayerIndex) {
        List<PlayerDeclarations> playerDeclarations = players
                .stream()
                .map(player -> new PlayerDeclarations(
                        player.getSeatIndex(),
                        player.getTeamIndex(),
                        detectDeclarations(player)
                ))
                .toList();

        Optional<PlayerDeclarations> belotWinner = playerDeclarations
                .stream()
                .filter(player -> player.declarations()
                        .stream()
                        .anyMatch(declaration -> declaration.getType() == Declaration.Type.BELOTE))
                .min(Comparator.comparingInt(player -> turnPriority(player.playerIndex(), startingPlayerIndex)));

        if (belotWinner.isPresent()) {
            PlayerDeclarations player = belotWinner.get();
            List<Declaration> declarations = player.declarations()
                    .stream()
                    .filter(declaration -> declaration.getType() == Declaration.Type.BELOTE)
                    .toList();

            return new Result(
                    player.teamIndex(),
                    player.teamIndex() == 0 ? new ArrayList<>(declarations) : List.of(),
                    player.teamIndex() == 1 ? new ArrayList<>(declarations) : List.of(),
                    true
            );
        }

        Candidate bestCandidate = null;
        for (PlayerDeclarations player : playerDeclarations) {
            for (Declaration declaration : player.declarations()) {
                Candidate candidate = new Candidate(player.playerIndex(), player.teamIndex(), declaration);
                if (isBetter(candidate, bestCandidate, startingPlayerIndex)) {
                    bestCandidate = candidate;
                }
            }
        }

        if (bestCandidate == null) {
            return new Result(-1, List.of(), List.of(), false);
        }

        int winningTeamIndex = bestCandidate.teamIndex();
        List<Declaration> winningDeclarations = playerDeclarations
                .stream()
                .filter(player -> player.teamIndex() == winningTeamIndex)
                .sorted(Comparator.comparingInt(player -> turnPriority(player.playerIndex(), startingPlayerIndex)))
                .flatMap(player -> player.declarations().stream())
                .collect(Collectors.toCollection(ArrayList::new));

        return new Result(
                winningTeamIndex,
                winningTeamIndex == 0 ? winningDeclarations : List.of(),
                winningTeamIndex == 1 ? winningDeclarations : List.of(),
                false
        );
    }

    private static List<Declaration> detectDeclarations(GamePlayer player) {
        List<Declaration> declarations = new ArrayList<>();
        List<Card> hand = player.getHand();

        findBelot(player.getSeatIndex(), hand).ifPresent(declarations::add);
        declarations.addAll(findFourOfAKind(player.getSeatIndex(), hand));
        declarations.addAll(findSequences(player.getSeatIndex(), hand));

        return declarations;
    }

    private static Optional<Declaration> findBelot(int playerIndex, List<Card> hand) {
        Map<Suite, List<Card>> cardsBySuite = hand.stream()
                .collect(Collectors.groupingBy(Card::getSuite, () -> new EnumMap<>(Suite.class), Collectors.toList()));

        return cardsBySuite.values()
                .stream()
                .filter(cards -> cards.size() == 8)
                .findFirst()
                .map(cards -> new Declaration(Declaration.Type.BELOTE, playerIndex, sortForDeclaration(cards)));
    }

    private static List<Declaration> findFourOfAKind(int playerIndex, List<Card> hand) {
        Map<Rank, List<Card>> cardsByRank = hand.stream()
                .collect(Collectors.groupingBy(Card::getRank, () -> new EnumMap<>(Rank.class), Collectors.toList()));

        return cardsByRank.entrySet()
                .stream()
                .filter(entry -> entry.getValue().size() == 4)
                .flatMap(entry -> fourOfAKindType(entry.getKey())
                        .stream()
                        .map(type -> new Declaration(type, playerIndex, sortForDeclaration(entry.getValue()))))
                .collect(Collectors.toCollection(ArrayList::new));
    }

    private static List<Declaration> findSequences(int playerIndex, List<Card> hand) {
        Map<Suite, Map<Rank, Card>> cardsBySuiteAndRank = new EnumMap<>(Suite.class);
        for (Suite suite : Suite.values()) {
            cardsBySuiteAndRank.put(suite, new EnumMap<>(Rank.class));
        }

        for (Card card : hand) {
            cardsBySuiteAndRank.get(card.getSuite()).put(card.getRank(), card);
        }

        List<Declaration> declarations = new ArrayList<>();
        for (Map<Rank, Card> cardsByRank : cardsBySuiteAndRank.values()) {
            List<Card> run = new ArrayList<>();

            for (Rank rank : DECLARATION_RANK_ORDER) {
                Card card = cardsByRank.get(rank);
                if (card == null) {
                    addSequence(playerIndex, run, declarations);
                    run.clear();
                    continue;
                }

                run.add(card);
            }

            addSequence(playerIndex, run, declarations);
        }

        return declarations;
    }

    private static void addSequence(int playerIndex, List<Card> run, List<Declaration> declarations) {
        if (run.size() < 3) {
            return;
        }

        declarations.add(new Declaration(sequenceType(run.size()), playerIndex, run));
    }

    private static Declaration.Type sequenceType(int length) {
        if (length == 3) {
            return Declaration.Type.SEQUENCE_3;
        }
        if (length == 4) {
            return Declaration.Type.SEQUENCE_4;
        }
        return Declaration.Type.SEQUENCE_5;
    }

    private static Optional<Declaration.Type> fourOfAKindType(Rank rank) {
        return switch (rank) {
            case JACK -> Optional.of(Declaration.Type.FOUR_JACKS);
            case NINE -> Optional.of(Declaration.Type.FOUR_NINES);
            case ACE, TEN, KING, QUEEN -> Optional.of(Declaration.Type.FOUR_OF_A_KIND);
            case EIGHT, SEVEN -> Optional.empty();
        };
    }

    private static boolean isBetter(Candidate candidate, Candidate currentBest, int startingPlayerIndex) {
        if (currentBest == null) {
            return true;
        }

        int candidatePoints = candidate.declaration().getPoints();
        int bestPoints = currentBest.declaration().getPoints();
        if (candidatePoints != bestPoints) {
            return candidatePoints > bestPoints;
        }

        if (isSequence(candidate.declaration()) && isSequence(currentBest.declaration())) {
            int candidateHighRank = rankStrength(candidate.declaration().getCards().getFirst().getRank());
            int bestHighRank = rankStrength(currentBest.declaration().getCards().getFirst().getRank());
            if (candidateHighRank != bestHighRank) {
                return candidateHighRank > bestHighRank;
            }
        }

        return turnPriority(candidate.playerIndex(), startingPlayerIndex)
                < turnPriority(currentBest.playerIndex(), startingPlayerIndex);
    }

    private static boolean isSequence(Declaration declaration) {
        return declaration.getType() == Declaration.Type.SEQUENCE_3
                || declaration.getType() == Declaration.Type.SEQUENCE_4
                || declaration.getType() == Declaration.Type.SEQUENCE_5;
    }

    private static int turnPriority(int playerIndex, int startingPlayerIndex) {
        return (playerIndex - startingPlayerIndex + 4) % 4;
    }

    private static int rankStrength(Rank rank) {
        return switch (rank) {
            case ACE -> 7;
            case KING -> 6;
            case QUEEN -> 5;
            case JACK -> 4;
            case TEN -> 3;
            case NINE -> 2;
            case EIGHT -> 1;
            case SEVEN -> 0;
        };
    }

    private static List<Card> sortForDeclaration(List<Card> cards) {
        return cards.stream()
                .sorted(Comparator
                        .comparing(Card::getSuite)
                        .thenComparing(card -> DECLARATION_RANK_ORDER.indexOf(card.getRank())))
                .collect(Collectors.toCollection(ArrayList::new));
    }
}
