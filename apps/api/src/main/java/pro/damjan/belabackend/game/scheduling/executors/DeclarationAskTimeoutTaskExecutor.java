package pro.damjan.belabackend.game.scheduling.executors;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import pro.damjan.belabackend.game.scheduling.tasks.ScheduledGameTask;
import pro.damjan.belabackend.game.scheduling.tasks.ScheduledTaskType;
import pro.damjan.belabackend.game.service.BeloteGameService;

@Component
@RequiredArgsConstructor
public class DeclarationAskTimeoutTaskExecutor implements ScheduledTaskExecutor {

    private final BeloteGameService gameService;

    @Override
    public ScheduledTaskType type() {
        return ScheduledTaskType.DECLARATION_ASK_TIMEOUT_TASK;
    }

    @Override
    public void execute(ScheduledGameTask task) {
        gameService.handleDeclarationAskTimeout(
                task.getGameId(),
                task.getRequiredIntParameter("roundNumber")
        );
    }
}
