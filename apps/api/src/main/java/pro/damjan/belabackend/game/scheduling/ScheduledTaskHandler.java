package pro.damjan.belabackend.game.scheduling;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import pro.damjan.belabackend.game.scheduling.executors.ScheduledTaskExecutor;
import pro.damjan.belabackend.game.scheduling.registry.ScheduledTaskRegistry;
import pro.damjan.belabackend.game.scheduling.tasks.ScheduledGameTask;
import pro.damjan.belabackend.game.scheduling.tasks.ScheduledTaskType;

import java.util.EnumMap;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
public class ScheduledTaskHandler {

    private final ScheduledTaskRegistry scheduledTaskRegistry;
    private final Map<ScheduledTaskType, ScheduledTaskExecutor> executors;

    public ScheduledTaskHandler(
            ScheduledTaskRegistry scheduledTaskRegistry,
            List<ScheduledTaskExecutor> executors
    ) {
        this.scheduledTaskRegistry = scheduledTaskRegistry;
        this.executors = new EnumMap<>(ScheduledTaskType.class);

        for (ScheduledTaskExecutor executor : executors) {
            this.executors.put(executor.type(), executor);
        }
    }

    public void handleTask(String taskId) {
        ScheduledGameTask task = scheduledTaskRegistry.getTaskById(taskId);

        if (task == null) {
            log.warn("Task not found for taskId: {}", taskId);
            return;
        }

        try {
            ScheduledTaskExecutor executor = executors.get(task.getType());
            if (executor == null) {
                throw new IllegalArgumentException("No executor registered for task type: " + task.getType());
            }

            executor.execute(task);
        } catch (Exception e) {
            log.error("Scheduled task failed: taskId={}, type={}, gameId={}", taskId, task.getType(), task.getGameId(), e);
        } finally {
            scheduledTaskRegistry.removeTask(task);
        }
    }
}
