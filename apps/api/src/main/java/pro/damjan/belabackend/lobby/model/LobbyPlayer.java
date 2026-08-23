package pro.damjan.belabackend.lobby.model;

import lombok.Getter;
import lombok.Setter;

import java.io.Serializable;

@Getter @Setter
public class LobbyPlayer implements Serializable {

    /**
     * Bot display names, in seat order. Server-side so that every client shows
     * the same roster; the frontend used to invent these per language, which
     * meant the same bot answered to a different name in /en and /hr.
     */
    private static final String[] BOT_NAMES = { "Bot Alpha", "Bot Beta", "Bot Gamma", "Bot Delta" };

    private String userId;
    private boolean isHost;
    private LobbyPlayerStatus status;
    private int seat;
    private boolean bot;

    /**
     * Captured when the player sits down rather than looked up per event, so a
     * seat carries everything needed to draw it. A rename mid-lobby is not
     * picked up until the lobby churns, which is the trade this shape makes.
     */
    private String username;
    private String avatarUrl;

    public LobbyPlayer() {}

    public LobbyPlayer(String userId, boolean isHost, LobbyPlayerStatus status) {
        this.userId = userId;
        this.isHost = isHost;
        this.status = status;
    }

    public LobbyPlayer(String userId, boolean isHost, LobbyPlayerStatus status, int seat) {
        this.userId = userId;
        this.isHost = isHost;
        this.status = status;
        this.seat = seat;
    }

    public static LobbyPlayer createBot() {
        LobbyPlayer bot = new LobbyPlayer();
        bot.setUserId("bot-" + java.util.UUID.randomUUID().toString().substring(0, 8));
        bot.setHost(false);
        bot.setStatus(LobbyPlayerStatus.READY);
        bot.setBot(true);
        return bot;
    }

    /** Named by seat, so the four bots at a table are always distinct. */
    public static String botNameForSeat(int seat) {
        return BOT_NAMES[Math.floorMod(seat, BOT_NAMES.length)];
    }

}
