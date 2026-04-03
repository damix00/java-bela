package pro.damjan.belabackend.game.scheduling.registry;

import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.script.RedisScript;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import pro.damjan.belabackend.game.scheduling.ScheduledTaskHandler;

import java.time.Instant;
import java.util.List;

@Service
@RequiredArgsConstructor
public class RedisScheduledTaskPoller implements ScheduledTaskPoller {

    private final StringRedisTemplate redisTemplate;
    private final RedisScript<List> popDueTasksScript;
    private final ScheduledTaskHandler scheduledTaskHandler;

    @Override
    public List<String> popDueTasks() {
        String now = String.valueOf(Instant.now().toEpochMilli());
        return redisTemplate.execute(popDueTasksScript, List.of(RedisScheduledTaskRegistry.ZSET_KEY), now);
    }

    @Scheduled(fixedRate = 500)
    public void pollDueTasks() {
        List<String> dueTasks = popDueTasks();
        for (String taskData : dueTasks) {
            scheduledTaskHandler.handleTask(taskData);
        }
    }

}
