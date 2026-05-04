package pro.damjan.belabackend.game.scheduling.registry;

import pro.damjan.belabackend.game.scheduling.tasks.ScheduledGameTask;

import java.util.List;

public interface ScheduledTaskRegistry {

    /**
     * Registers a task to be scheduled.
     * @param task the task to register
     */
    void registerTask(ScheduledGameTask task);
    void removeTask(ScheduledGameTask task);

    void removeTasksForGame(ScheduledGameTask task);
    void removeTasksForGame(String gameId);

    ScheduledGameTask getTaskById(String taskId);

}
