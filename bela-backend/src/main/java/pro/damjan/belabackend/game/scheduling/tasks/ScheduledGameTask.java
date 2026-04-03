package pro.damjan.belabackend.game.scheduling.tasks;

import lombok.Getter;
import pro.damjan.belabackend.game.model.BeloteGame;

import java.io.Serializable;
import java.time.Duration;

@Getter
public class ScheduledGameTask {

    private final String name;

    private final Duration delay;
    private final String gameId;

    public ScheduledGameTask(String name, Duration delay, String gameId) {
        this.name = name;
        this.delay = delay;
        this.gameId = gameId;
    }

    public ScheduledGameTask(String name, Duration delay, BeloteGame game) {
        this(name, delay, game.getId());
    }

    public String getTaskId() {
        return gameId + ":" + name;
    }

}
