package pro.damjan.belabackend.game.scheduling.tasks;


import lombok.Getter;
import pro.damjan.belabackend.game.model.BeloteGame;

import java.time.Duration;

@Getter
public class RoundStartTask extends ScheduledGameTask {

    public RoundStartTask(String gameId) {
        super("round_start_task", Duration.ofSeconds(3), gameId);
    }
}
