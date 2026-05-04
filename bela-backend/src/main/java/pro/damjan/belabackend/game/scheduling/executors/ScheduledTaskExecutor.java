package pro.damjan.belabackend.game.scheduling.executors;

import pro.damjan.belabackend.game.scheduling.tasks.ScheduledGameTask;
import pro.damjan.belabackend.game.scheduling.tasks.ScheduledTaskType;

public interface ScheduledTaskExecutor {

    ScheduledTaskType type();

    void execute(ScheduledGameTask task);
}
