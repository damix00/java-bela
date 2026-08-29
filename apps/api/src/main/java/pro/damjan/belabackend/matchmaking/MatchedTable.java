package pro.damjan.belabackend.matchmaking;

import java.util.List;

/** Two to four lobbies that together fill a table, each with the side it takes. */
public record MatchedTable(List<MatchedLobby> lobbies) {

    public MatchedTable {
        lobbies = List.copyOf(lobbies);
    }
}
