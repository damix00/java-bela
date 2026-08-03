package pro.damjan.belabackend.game.scheduling.executors;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import pro.damjan.belabackend.game.scheduling.tasks.ScheduledGameTask;
import pro.damjan.belabackend.game.scheduling.tasks.ScheduledTaskType;
import pro.damjan.belabackend.game.service.BeloteGameService;

@Component
@RequiredArgsConstructor
public class NextTrickStartTaskExecutor implements ScheduledTaskExecutor {

    private final BeloteGameService gameService;

    @Override
    public ScheduledTaskType type() {
        return ScheduledTaskType.NEXT_TRICK_START_TASK;
    }

    @Override
    public void execute(ScheduledGameTask task) {
        gameService.handleNextTrickStart(
                task.getGameId(),
                task.getRequiredIntParameter("roundNumber"),
                task.getRequiredIntParameter("completedTrickNumber"),
                task.getRequiredIntParameter("winningTurnIndex")
        );
    }
}
