package pro.damjan.belabackend.game.scheduling.executors;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import pro.damjan.belabackend.game.scheduling.tasks.ScheduledGameTask;
import pro.damjan.belabackend.game.scheduling.tasks.ScheduledTaskType;
import pro.damjan.belabackend.game.service.BeloteGameService;

@Component
@RequiredArgsConstructor
public class RoundStartTaskExecutor implements ScheduledTaskExecutor {

    private final BeloteGameService beloteGameService;

    @Override
    public ScheduledTaskType type() {
        return ScheduledTaskType.ROUND_START_TASK;
    }

    @Override
    public void execute(ScheduledGameTask task) {
        beloteGameService.startRound(
                task.getGameId(),
                task.getRequiredIntParameter("roundNumber")
        );
    }
}
