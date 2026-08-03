package pro.damjan.belabackend.game.scheduling.tasks;

import java.io.Serializable;

public enum ScheduledTaskType implements Serializable {
    ROUND_START_TASK,
    CHOOSING_TRUMP_TIMEOUT_TASK,
    BOT_TRUMP_CHOICE_TASK,
    DECLARATIONS_COMPLETE_TASK,
    CARD_THROW_TIMEOUT_TASK,
    NEXT_TRICK_START_TASK,
}
