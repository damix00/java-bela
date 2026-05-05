package pro.damjan.belabackend.game.scheduling.executors;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import pro.damjan.belabackend.game.scheduling.tasks.ScheduledGameTask;
import pro.damjan.belabackend.game.scheduling.tasks.ScheduledTaskType;
import pro.damjan.belabackend.game.service.BeloteGameService;

@Component
@RequiredArgsConstructor
public class DeclarationsCompleteTaskExecutor implements ScheduledTaskExecutor {

    private final BeloteGameService gameService;

    @Override
    public ScheduledTaskType type() {
        return ScheduledTaskType.DECLARATIONS_COMPLETE_TASK;
    }

    @Override
    public void execute(ScheduledGameTask task) {
        gameService.handleDeclarationsComplete(
                task.getGameId(),
                task.getRequiredIntParameter("roundNumber")
        );
    }
}
