package pro.damjan.belabackend.game.scheduling.registry;

import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.script.RedisScript;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;
import org.springframework.stereotype.Service;
import pro.damjan.belabackend.game.scheduling.ScheduledTaskHandler;

import java.time.Instant;
import java.util.Collections;
import java.util.List;
import java.util.concurrent.CompletableFuture;

@Service
@RequiredArgsConstructor
public class RedisScheduledTaskPoller implements ScheduledTaskPoller {

    private final StringRedisTemplate redisTemplate;
    private final RedisScript<List> popDueTasksScript;
    private final ScheduledTaskHandler scheduledTaskHandler;
    private final ThreadPoolTaskExecutor taskExecutor;

    @Override
    public List<String> popDueTasks() {
        String now = String.valueOf(Instant.now().toEpochMilli());
        List<String> taskIds = redisTemplate.execute(popDueTasksScript, List.of(RedisScheduledTaskRegistry.ZSET_KEY), now);
        return taskIds == null ? Collections.emptyList() : taskIds;
    }

    @Scheduled(fixedRate = 500)
    public void pollDueTasks() {
        List<String> dueTasks = popDueTasks();
        for (String taskId : dueTasks) {
            CompletableFuture.runAsync(() -> scheduledTaskHandler.handleTask(taskId), taskExecutor);
        }
    }

}
