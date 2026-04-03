package pro.damjan.belabackend.game.scheduling;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import pro.damjan.belabackend.game.scheduling.registry.ScheduledTaskRegistry;

@Service
@RequiredArgsConstructor
public class ScheduledTaskHandler {

    private final ScheduledTaskRegistry scheduledTaskRegistry;

    public void handleTask(String taskData) {
        // Here you would parse the taskData and execute the appropriate logic
        // For example, if taskData is a JSON string representing a ScheduledGameEvent,
        // you would deserialize it and then perform the necessary actions based on the event type.
        System.out.println("Handling task: " + taskData);

//        scheduledTaskRegistry.removeTask();
    }
}
