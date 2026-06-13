package pro.damjan.belabackend.game.scheduling.registry;

import pro.damjan.belabackend.game.scheduling.tasks.ScheduledGameTask;
import pro.damjan.belabackend.game.scheduling.tasks.ScheduledTaskType;

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

    /**
     * Removes all scheduled tasks of the given type for a game. Used to cancel a superseded
     * timer (e.g. the previous turn's card-throw timeout) so only one remains active per game.
     */
    void removeGameTasksOfType(String gameId, ScheduledTaskType type);

    ScheduledGameTask getTaskById(String taskId);

    /**
     * Returns the remaining seconds until the active task of the given type fires for the game,
     * derived from the stored execution time (deadline). Returns null when no such task is scheduled.
     */
    Long getRemainingSeconds(String gameId, ScheduledTaskType type);

}
