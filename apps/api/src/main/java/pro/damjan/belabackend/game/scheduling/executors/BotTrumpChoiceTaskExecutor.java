package pro.damjan.belabackend.game.scheduling.executors;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import pro.damjan.belabackend.game.scheduling.tasks.ScheduledGameTask;
import pro.damjan.belabackend.game.scheduling.tasks.ScheduledTaskType;
import pro.damjan.belabackend.game.service.BeloteGameService;

@Component
@RequiredArgsConstructor
public class BotTrumpChoiceTaskExecutor implements ScheduledTaskExecutor {

    private final BeloteGameService gameService;

    @Override
    public ScheduledTaskType type() {
        return ScheduledTaskType.BOT_TRUMP_CHOICE_TASK;
    }

    @Override
    public void execute(ScheduledGameTask task) {
        gameService.handleBotTrumpChoice(
                task.getGameId(),
                task.getRequiredIntParameter("roundNumber"),
                task.getRequiredIntParameter("turnIndex")
        );
    }
}
