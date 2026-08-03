package pro.damjan.belabackend.game.scheduling.tasks;

import lombok.Getter;
import lombok.Setter;

import java.io.Serializable;
import java.time.Duration;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Getter @Setter
public class ScheduledGameTask implements Serializable {

    private String taskId;
    private Duration delay;
    private String gameId;
    private ScheduledTaskType type;
    private Map<String, Object> parameters = new HashMap<>();

    public ScheduledGameTask() {}

    public ScheduledGameTask(ScheduledTaskType type, Duration delay, String gameId) {
        this(type, delay, gameId, Map.of());
    }

    public ScheduledGameTask(ScheduledTaskType type, Duration delay, String gameId, Map<String, Object> parameters) {
        this.taskId = UUID.randomUUID().toString();
        this.delay = delay;
        this.gameId = gameId;
        this.type = type;
        this.parameters = parameters == null ? new HashMap<>() : new HashMap<>(parameters);
    }

    public void ensureTaskId() {
        if (taskId == null || taskId.isBlank()) {
            taskId = UUID.randomUUID().toString();
        }
    }

    public Object getParameter(String name) {
        return parameters == null ? null : parameters.get(name);
    }

    public String getRequiredStringParameter(String name) {
        Object value = getParameter(name);
        if (value == null) {
            throw new IllegalArgumentException("Missing scheduled task parameter: " + name);
        }

        return String.valueOf(value);
    }

    public int getRequiredIntParameter(String name) {
        Object value = getParameter(name);
        if (value instanceof Number number) {
            return number.intValue();
        }

        return Integer.parseInt(getRequiredStringParameter(name));
    }
}
