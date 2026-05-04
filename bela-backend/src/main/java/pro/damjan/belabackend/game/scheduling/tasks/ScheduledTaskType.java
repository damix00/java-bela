package pro.damjan.belabackend.game.scheduling.tasks;

import java.io.Serializable;

public enum ScheduledTaskType implements Serializable {
    ROUND_START_TASK,
    CHOOSING_TRUMP_TIMEOUT_TASK,
}
