package pro.damjan.belabackend.matchmaking;

/**
 * What matchmaking needs done once it has a table, without knowing who does it.
 *
 * Declared here and implemented on the lobby side, so the dependency runs lobby to matchmaking in
 * one direction only — the same shape the lobby package already has with the game package. A
 * direct call rather than an application event: Spring's events never leave the JVM that publishes
 * them, so routing through one would have looked like message passing while buying nothing.
 */
public interface MatchedTableHandler {

    void onTableFormed(MatchedTable table);
}
