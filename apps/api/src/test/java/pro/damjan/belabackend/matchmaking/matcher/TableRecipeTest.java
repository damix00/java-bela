package pro.damjan.belabackend.matchmaking.matcher;

import org.junit.jupiter.api.Test;
import pro.damjan.belabackend.matchmaking.ticket.TicketShape;

import java.util.ArrayList;
import java.util.EnumMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;

class TableRecipeTest {

    @Test
    void everyRecipeSeatsExactlyTwoPlayersPerTeam() {
        for (TableRecipe recipe : TableRecipe.values()) {
            assertThat(canSeat(shapesOf(recipe)))
                    .as("%s does not fill a table", recipe)
                    .isTrue();
        }
    }

    /**
     * The recipes are the whole reason matching is cheap, so this checks the list is complete by
     * brute force rather than trusting it: every way of grouping four players is enumerated, and
     * the ones that can seat must be exactly the six named.
     */
    @Test
    void theSixRecipesAreEveryCombinationThatCanSeat() {
        Set<Map<TicketShape, Integer>> seatable = new HashSet<>();

        for (List<TicketShape> combination : combinationsOfFourPlayers()) {
            if (canSeat(combination)) seatable.add(countsOf(combination));
        }

        Set<Map<TicketShape, Integer>> declared = new HashSet<>();
        for (TableRecipe recipe : TableRecipe.values()) {
            declared.add(recipe.counts());
        }

        assertThat(declared).isEqualTo(seatable);
    }

    @Test
    void aPairAndASplitIsTheCombinationThatCannotSeat() {
        assertThat(canSeat(List.of(TicketShape.PAIR, TicketShape.SPLIT))).isFalse();
    }

    @Test
    void peekLimitsCoverTheGreediestRecipe() {
        assertThat(TableRecipe.maxNeeded(TicketShape.SOLO)).isEqualTo(4);
        assertThat(TableRecipe.maxNeeded(TicketShape.PAIR)).isEqualTo(2);
        assertThat(TableRecipe.maxNeeded(TicketShape.SPLIT)).isEqualTo(2);
        assertThat(TableRecipe.maxNeeded(TicketShape.TRIO)).isEqualTo(1);
    }

    @Test
    void everyShapeIsUsableBySomeRecipe() {
        for (TicketShape shape : TicketShape.values()) {
            assertThat(TableRecipe.maxNeeded(shape))
                    .as("no recipe can ever seat a %s", shape)
                    .isPositive();
        }
    }

    // --- helpers ---

    private static List<TicketShape> shapesOf(TableRecipe recipe) {
        List<TicketShape> shapes = new ArrayList<>();
        recipe.counts().forEach((shape, count) -> {
            for (int i = 0; i < count; i++) shapes.add(shape);
        });
        return shapes;
    }

    private static Map<TicketShape, Integer> countsOf(List<TicketShape> shapes) {
        Map<TicketShape, Integer> counts = new EnumMap<>(TicketShape.class);
        for (TicketShape shape : shapes) counts.merge(shape, 1, Integer::sum);
        return counts;
    }

    /** Every multiset of shapes totalling four players. */
    private static List<List<TicketShape>> combinationsOfFourPlayers() {
        List<List<TicketShape>> found = new ArrayList<>();
        build(new ArrayList<>(), 0, found);
        return found;
    }

    private static void build(List<TicketShape> current, int startIndex, List<List<TicketShape>> found) {
        int players = current.stream().mapToInt(TicketShape::size).sum();

        if (players == 4) {
            found.add(List.copyOf(current));
            return;
        }
        if (players > 4) return;

        for (int i = startIndex; i < TicketShape.values().length; i++) {
            current.add(TicketShape.values()[i]);
            build(current, i, found);
            current.removeLast();
        }
    }

    /** True if some way of flipping the shapes onto teams fills both sides. */
    private static boolean canSeat(List<TicketShape> shapes) {
        for (int flips = 0; flips < (1 << shapes.size()); flips++) {
            int teamZero = 0;
            int teamOne = 0;

            for (int i = 0; i < shapes.size(); i++) {
                boolean flipped = (flips & (1 << i)) != 0;
                teamZero += flipped ? shapes.get(i).minor() : shapes.get(i).major();
                teamOne += flipped ? shapes.get(i).major() : shapes.get(i).minor();
            }

            if (teamZero == TicketShape.SEATS_PER_TEAM && teamOne == TicketShape.SEATS_PER_TEAM) {
                return true;
            }
        }

        return false;
    }
}
