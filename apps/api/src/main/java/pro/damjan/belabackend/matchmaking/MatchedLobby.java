package pro.damjan.belabackend.matchmaking;

/**
 * One lobby's place at a matched table.
 *
 * {@code flipped} says which side of the table this lobby's larger group takes: false for team 0,
 * true for team 1. It is expressed relative to the lobby's own grouping rather than as concrete
 * seats so that matchmaking never has to know what a seat is — the lobby side resolves it, since
 * it is the one holding the players.
 *
 * Flat by design. Ids and primitives only, no {@code Lobby}, so this can cross a queue or a topic
 * unchanged if the boundary ever stops being a method call.
 */
public record MatchedLobby(String lobbyId, boolean flipped) {}
