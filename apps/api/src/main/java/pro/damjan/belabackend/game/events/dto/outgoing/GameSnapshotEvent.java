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
                ? RoundSnapshot.from(game.getCurrentRound(), timerType, timeoutSeconds)
                : null;
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
        private List<Card> hand; // only set for the perspective player
        private int cardCount;

        private PlayerSnapshot(String userId, int seatIndex, boolean bot, List<Card> hand, int cardCount) {
            this.userId = userId;
            this.seatIndex = seatIndex;
            this.bot = bot;
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
        private final int currentTurnIndex;
        private final int currentTrickNumber;
        private final List<PlayedCard> currentTrickCards;
        private final int team1RoundPoints;
        private final int team2RoundPoints;
        private final List<Declaration> team1Declarations;
        private final List<Declaration> team2Declarations;
        // seat indices of players who opted out of declaring their declarations this round
        private final List<Integer> declinedDeclarationSeats;
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
                int currentTurnIndex,
                int currentTrickNumber,
                List<PlayedCard> currentTrickCards,
                int team1RoundPoints,
                int team2RoundPoints,
                List<Declaration> team1Declarations,
                List<Declaration> team2Declarations,
                List<Integer> declinedDeclarationSeats,
                String timerType,
                Long timeoutSeconds,
                Integer currentTrickWinningPlayerIndex
        ) {
            this.roundNumber = roundNumber;
            this.roundStatus = roundStatus;
            this.trumpSuite = trumpSuite;
            this.currentTurnIndex = currentTurnIndex;
            this.currentTrickNumber = currentTrickNumber;
            this.currentTrickCards = currentTrickCards;
            this.team1RoundPoints = team1RoundPoints;
            this.team2RoundPoints = team2RoundPoints;
            this.team1Declarations = team1Declarations;
            this.team2Declarations = team2Declarations;
            this.declinedDeclarationSeats = declinedDeclarationSeats;
            this.timerType = timerType;
            this.timeoutSeconds = timeoutSeconds;
            this.currentTrickWinningPlayerIndex = currentTrickWinningPlayerIndex;
        }

        public static RoundSnapshot from(BeloteRound round, String timerType, Long timeoutSeconds) {
            var currentTrick = round.getCurrentTrick();
            Integer winningPlayerIndex = currentTrick != null && currentTrick.isComplete()
                    ? currentTrick.getWinningPlayerIndex()
                    : null;

            List<Integer> declinedSeats = round.getRoundPlayers().stream()
                    .filter(player -> !player.isChoosesToDeclare())
                    .map(pro.damjan.belabackend.game.model.round.RoundPlayer::getPlayerIndex)
                    .toList();

            return new RoundSnapshot(
                    round.getRoundNumber(),
                    round.getRoundStatus(),
                    round.getTrumpSuite(),
                    round.getCurrentTurnIndex(),
                    round.getCurrentTrickNumber(),
                    currentTrick == null ? List.of() : currentTrick.getPlayedCards(),
                    round.getTeam1RoundScore(),
                    round.getTeam2RoundScore(),
                    round.getDeclarations(0),
                    round.getDeclarations(1),
                    declinedSeats,
                    timerType,
                    timeoutSeconds,
                    winningPlayerIndex
            );
        }
    }
}
