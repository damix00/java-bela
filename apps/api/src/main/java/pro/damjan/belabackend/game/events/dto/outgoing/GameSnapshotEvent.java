package pro.damjan.belabackend.game.events.dto.outgoing;

import lombok.Getter;
import lombok.Setter;
import pro.damjan.belabackend.game.model.BeloteGame;
import pro.damjan.belabackend.game.model.GameStatus;
import pro.damjan.belabackend.game.model.card.Card;
import pro.damjan.belabackend.game.model.card.CardOrdering;
import pro.damjan.belabackend.game.model.card.Declaration;
import pro.damjan.belabackend.game.model.card.Suite;
import pro.damjan.belabackend.game.model.player.GamePlayer;
import pro.damjan.belabackend.game.model.round.BeloteRound;
import pro.damjan.belabackend.game.model.round.RoundPlayer;
import pro.damjan.belabackend.game.model.round.RoundStatus;
import pro.damjan.belabackend.game.model.round.trick.PlayedCard;
import pro.damjan.belabackend.websocket.events.dto.OutgoingEvent;

import java.util.List;

// This event is intended to provide a complete snapshot of the current game state to a single player.
// We use this for sanitizing the game state for each player, so they only receive information
// they're supposed to see (e.g. their own hand, but not opponents' hands).
@Getter @Setter
public class GameSnapshotEvent extends PerspectiveOutgoingEvent {

    private String gameId;
    private GameStatus status;
    private int maxPoints;
    private TeamSnapshot team1;
    private TeamSnapshot team2;
    private RoundSnapshot currentRound;

    public GameSnapshotEvent(BeloteGame game, String perspectiveUserId) {
        this(game, perspectiveUserId, null, null);
    }

    // timerType + timeoutSeconds describe the active countdown (which timer is running and how many
    // seconds remain) so a reconnecting client can rebuild the correct indicator in sync with the
    // server's scheduled timeout.
    public GameSnapshotEvent(BeloteGame game, String perspectiveUserId, String timerType, Long timeoutSeconds) {
        super("game:snapshot", perspectiveUserId);
        this.gameId = game.getId();
        this.status = game.getStatus();
        this.maxPoints = game.getMaxPoints();
        this.team1 = TeamSnapshot.from(game.getTeam1(), perspectiveUserId);
        this.team2 = TeamSnapshot.from(game.getTeam2(), perspectiveUserId);
        this.currentRound = game.getCurrentRound() != null
                ? RoundSnapshot.from(game.getCurrentRound(), seatOf(game, perspectiveUserId), timerType, timeoutSeconds)
                : null;
    }

    // The seat the snapshot is being built for, or null for a viewer who is not at this table.
    private static Integer seatOf(BeloteGame game, String perspectiveUserId) {
        return game.getPlayers().stream()
                .filter(player -> player.getUserId().equals(perspectiveUserId))
                .map(GamePlayer::getSeatIndex)
                .findFirst()
                .orElse(null);
    }

    @Getter @Setter
    public static class TeamSnapshot {
        private List<PlayerSnapshot> players;
        private int totalScore;

        private TeamSnapshot(List<PlayerSnapshot> players, int totalScore) {
            this.players = players;
            this.totalScore = totalScore;
        }

        public static TeamSnapshot from(pro.damjan.belabackend.game.model.player.Team team, String perspectiveUserId) {
            List<PlayerSnapshot> players = team.getPlayers().stream()
                    .map(p -> PlayerSnapshot.from(p, perspectiveUserId))
                    .toList();
            return new TeamSnapshot(players, team.getTotalScore());
        }
    }

    @Getter @Setter
    public static class PlayerSnapshot {
        private String userId;
        private int seatIndex;
        private boolean bot;
        // Identity is not perspective-dependent the way the hand is: everybody at
        // the table may see everybody's name, and both fields are already public
        // on GET /users/{id}.
        private String username;
        private String avatarUrl;
        private List<Card> hand; // only set for the perspective player
        private int cardCount;

        private PlayerSnapshot(String userId, int seatIndex, boolean bot, String username,
                               String avatarUrl, List<Card> hand, int cardCount) {
            this.userId = userId;
            this.seatIndex = seatIndex;
            this.bot = bot;
            this.username = username;
            this.avatarUrl = avatarUrl;
            this.hand = hand;
            this.cardCount = cardCount;
        }

        public static PlayerSnapshot from(GamePlayer player, String perspectiveUserId) {
            boolean isSelf = player.getUserId().equals(perspectiveUserId);

            List<Card> hand = isSelf
                    ? CardOrdering.sortForClient(player.getHand().stream().filter(c -> !c.isHidden()).toList())
                    : null;

            return new PlayerSnapshot(
                    player.getUserId(),
                    player.getSeatIndex(),
                    player.isBot(),
                    player.getUsername(),
                    player.getAvatarUrl(),
                    hand,
                    player.getHand().size()
            );
        }
    }

    @Getter
    public static class RoundSnapshot {
        private final int roundNumber;
        private final RoundStatus roundStatus;
        private final Suite trumpSuite;
        // seat that called trump this round, or null while nobody has
        private final Integer trumpCallerIndex;
        private final int currentTurnIndex;
        private final int currentTrickNumber;
        private final List<PlayedCard> currentTrickCards;
        private final int team1RoundPoints;
        private final int team2RoundPoints;
        // Points taken in tricks, with no zvanja in them. The scoreboard counts the two apart: what
        // the cards have won so far, and the declarations sitting on top of it.
        private final int team1CardPoints;
        private final int team2CardPoints;
        private final List<Declaration> team1Declarations;
        private final List<Declaration> team2Declarations;
        // seat indices of players who opted out of declaring their declarations this round.
        // Withheld (empty) during the ask, when who declined is not yet public.
        private final List<Integer> declinedDeclarationSeats;
        // seat indices of players who have answered the declarations question — who the table waits on
        private final List<Integer> answeredDeclarationSeats;
        // the perspective player's own zvanja, so they can be asked about them without anyone
        // else's holdings travelling with the question
        private final List<Declaration> myDeclarations;
        // the active countdown: which timer is running (ScheduledTaskType name) and seconds remaining.
        // Both null when no client-facing timer is active.
        private final String timerType;
        private final Long timeoutSeconds;
        // winner of the current trick once it is complete (for rebuilding the pending indicator); else null
        private final Integer currentTrickWinningPlayerIndex;

        private RoundSnapshot(
                int roundNumber,
                RoundStatus roundStatus,
                Suite trumpSuite,
                Integer trumpCallerIndex,
                int currentTurnIndex,
                int currentTrickNumber,
                List<PlayedCard> currentTrickCards,
                int team1RoundPoints,
                int team2RoundPoints,
                int team1CardPoints,
                int team2CardPoints,
                List<Declaration> team1Declarations,
                List<Declaration> team2Declarations,
                List<Integer> declinedDeclarationSeats,
                List<Integer> answeredDeclarationSeats,
                List<Declaration> myDeclarations,
                String timerType,
                Long timeoutSeconds,
                Integer currentTrickWinningPlayerIndex
        ) {
            this.roundNumber = roundNumber;
            this.roundStatus = roundStatus;
            this.trumpSuite = trumpSuite;
            this.trumpCallerIndex = trumpCallerIndex;
            this.currentTurnIndex = currentTurnIndex;
            this.currentTrickNumber = currentTrickNumber;
            this.currentTrickCards = currentTrickCards;
            this.team1RoundPoints = team1RoundPoints;
            this.team2RoundPoints = team2RoundPoints;
            this.team1CardPoints = team1CardPoints;
            this.team2CardPoints = team2CardPoints;
            this.team1Declarations = team1Declarations;
            this.team2Declarations = team2Declarations;
            this.declinedDeclarationSeats = declinedDeclarationSeats;
            this.answeredDeclarationSeats = answeredDeclarationSeats;
            this.myDeclarations = myDeclarations;
            this.timerType = timerType;
            this.timeoutSeconds = timeoutSeconds;
            this.currentTrickWinningPlayerIndex = currentTrickWinningPlayerIndex;
        }

        public static RoundSnapshot from(
                BeloteRound round,
                Integer perspectiveSeat,
                String timerType,
                Long timeoutSeconds
        ) {
            var currentTrick = round.getCurrentTrick();
            Integer winningPlayerIndex = currentTrick != null && currentTrick.isComplete()
                    ? currentTrick.getWinningPlayerIndex()
                    : null;

            // The ask is private. Until the reveal, the resolved sets and the opt-outs stay on the
            // server: a snapshot mid-ask (a reconnect, or the broadcast an answer triggers) would
            // otherwise hand the table both what everyone holds and who just declined. The check
            // lives here, at the point of construction, so no call site can opt out of it.
            boolean asking = round.getRoundStatus() == RoundStatus.DECLARING;

            List<Integer> declinedSeats = asking
                    ? List.of()
                    : round.getRoundPlayers().stream()
                            .filter(player -> !player.isChoosesToDeclare())
                            .map(RoundPlayer::getPlayerIndex)
                            .toList();

            return new RoundSnapshot(
                    round.getRoundNumber(),
                    round.getRoundStatus(),
                    round.getTrumpSuite(),
                    round.getTrumpCallerIndex(),
                    round.getCurrentTurnIndex(),
                    round.getCurrentTrickNumber(),
                    currentTrick == null ? List.of() : currentTrick.getPlayedCards(),
                    asking ? round.getCardPoints(0) : round.getTeam1RoundScore(),
                    asking ? round.getCardPoints(1) : round.getTeam2RoundScore(),
                    round.getCardPoints(0),
                    round.getCardPoints(1),
                    asking ? List.of() : round.getDeclarations(0),
                    asking ? List.of() : round.getDeclarations(1),
                    declinedSeats,
                    round.answeredDeclarationSeats(),
                    ownDeclarations(round, perspectiveSeat),
                    timerType,
                    timeoutSeconds,
                    winningPlayerIndex
            );
        }

        /** The perspective player's own detected zvanja — read from their seat, never from anyone else's. */
        private static List<Declaration> ownDeclarations(BeloteRound round, Integer perspectiveSeat) {
            if (perspectiveSeat == null) {
                return List.of();
            }

            return round.getRoundPlayer(perspectiveSeat).getDeclarations().stream()
                    .filter(declaration -> declaration.getType() != Declaration.Type.BELA)
                    .toList();
        }
    }
}
