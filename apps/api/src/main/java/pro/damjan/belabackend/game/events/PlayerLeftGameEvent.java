package pro.damjan.belabackend.game.events;

/**
 * Published once a player has left a finished game, so the lobby side can take them back.
 *
 * An application event rather than a direct call: the lobby package already depends on the game
 * package, and injecting a lobby service here would close that cycle.
 */
public record PlayerLeftGameEvent(String userId) {}
