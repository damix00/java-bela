package pro.damjan.belabackend.lobby.service.lifecycle;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import pro.damjan.belabackend.game.model.BeloteGame;
import pro.damjan.belabackend.game.model.player.GamePlayer;
import pro.damjan.belabackend.game.service.BeloteGameService;
import pro.damjan.belabackend.lobby.model.Lobby;
import pro.damjan.belabackend.lobby.model.LobbyPlayer;
import pro.damjan.belabackend.lobby.repository.LobbyRepository;
import pro.damjan.belabackend.lobby.service.LobbyGameStarter;
import pro.damjan.belabackend.matchmaking.MatchedLobby;
import pro.damjan.belabackend.matchmaking.MatchedTable;
import pro.damjan.belabackend.matchmaking.MatchedTableHandler;
import pro.damjan.belabackend.matchmaking.ticket.TicketShape;

import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Deque;
import java.util.List;

/**
 * Turns a matched table into a game.
 *
 * The lobby half of matchmaking, and the reason matchmaking itself never has to know what a seat
 * is: it decides which lobbies play and which side each takes, and the translation into seats
 * happens here, where the players actually live.
 *
 * The lobbies are not merged. Each one stays exactly as it was and simply points at the shared
 * game, so when it ends every player is taken back to the lobby they queued from — a pair to their
 * pair, each solo to their own. That fall-back-home path needs no code: presence never stopped
 * naming their original lobby, so {@link LobbyReturnService} already routes them correctly.
 *
 * Implements the interface matchmaking declares rather than being called by name, which keeps the
 * dependency running lobby to matchmaking in one direction.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class LobbyMatchService implements MatchedTableHandler {

    /** Seats belonging to each team: 0 and 2 play against 1 and 3, as {@code Team.pairFrom} deals. */
    private static final int[][] TEAM_SEATS = { { 0, 2 }, { 1, 3 } };

    private final LobbyRepository lobbyRepository;
    private final BeloteGameService beloteGameService;
    private final LobbyGameStarter lobbyGameStarter;

    /**
     * Deliberately not taken under the lobby locks, unlike every other path that writes a lobby.
     *
     * This one touches four lobbies at once, and the caller already holds the lock of the lobby
     * whose ready triggered the match. Acquiring the other three on top of that is a lock-order
     * inversion waiting to happen: two instances seating overlapping tables would each hold one
     * lobby and wait for the other's, and neither would move until the leases expired. Ordering
     * the acquisitions cannot fix it while a lock is already held from outside.
     *
     * What makes that acceptable is that matchmaking has already committed these tickets under
     * its own lock, so no other instance can reach these lobbies through matchmaking at all. The
     * narrow window left is a player changing their own lobby by hand in the instant between the
     * commit and the seating, which the ticket revalidation above is what guards.
     */
    @Override
    public void onTableFormed(MatchedTable table) {
        List<Lobby> lobbies = new ArrayList<>();

        for (MatchedLobby seated : table.lobbies()) {
            Lobby lobby = lobbyRepository.findById(seated.lobbyId()).orElse(null);

            // Matchmaking revalidated these under its lock, so this should not happen. If it
            // somehow does, abandoning the table is the safe move: the survivors are no longer
            // queued and will be back the moment anyone readies again.
            if (lobby == null) {
                log.warn("Matched lobby {} vanished before its game could start; abandoning table",
                        seated.lobbyId());
                return;
            }

            lobbies.add(lobby);
        }

        List<GamePlayer> seating = seat(table, lobbies);
        BeloteGame game = beloteGameService.createGame(seating, lobbies.getFirst().getGameConfiguration());

        for (Lobby lobby : lobbies) {
            lobbyGameStarter.attachToGame(lobby, game);
        }
    }

    /**
     * Lays the matched lobbies out across the four seats.
     *
     * Each lobby keeps its own pairing: players who sat together stay together, players who chose
     * opposing seats stay opposed. A lobby's larger group goes to team 0 unless the table says it
     * is flipped, and the smaller group takes the other side — which is all it takes to preserve
     * every arrangement, because that is the only choice a lobby's shape leaves open.
     */
    private List<GamePlayer> seat(MatchedTable table, List<Lobby> lobbies) {
        List<Deque<Integer>> freeSeats = List.of(
                new ArrayDeque<>(Arrays.stream(TEAM_SEATS[0]).boxed().toList()),
                new ArrayDeque<>(Arrays.stream(TEAM_SEATS[1]).boxed().toList()));

        GamePlayer[] bySeat = new GamePlayer[Lobby.MAX_PLAYERS];

        for (int i = 0; i < lobbies.size(); i++) {
            Lobby lobby = lobbies.get(i);
            boolean flipped = table.lobbies().get(i).flipped();
            int majorParity = TicketShape.majorParity(lobby);

            for (LobbyPlayer player : lobby.getActivePlayers()) {
                boolean inMajorGroup = player.getSeat() % 2 == majorParity;
                int team = inMajorGroup == !flipped ? 0 : 1;

                Integer seat = freeSeats.get(team).poll();
                if (seat == null) {
                    throw new IllegalStateException(
                            "Matched table over-filled team " + team + " seating lobby " + lobby.getId());
                }

                bySeat[seat] = new GamePlayer(
                        player.getUserId(), seat, player.isBot(), player.getUsername(), player.getAvatarUrl());
            }
        }

        for (int seat = 0; seat < bySeat.length; seat++) {
            if (bySeat[seat] == null) {
                throw new IllegalStateException("Matched table left seat " + seat + " empty");
            }
        }

        return List.of(bySeat);
    }
}
