package pro.damjan.belabackend.game.scheduling.registry;

import java.util.List;

public interface ScheduledTaskPoller {
    List<String> popDueTasks();
}
