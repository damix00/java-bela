package pro.damjan.belabackend.game.scheduling.registry;

import lombok.Getter;
import lombok.RequiredArgsConstructor;
import lombok.Setter;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import pro.damjan.belabackend.game.scheduling.tasks.ScheduledGameTask;
import tools.jackson.databind.ObjectMapper;

@Getter @Setter
@Service
@RequiredArgsConstructor
public class RedisScheduledTaskRegistry implements ScheduledTaskRegistry {

    private final StringRedisTemplate redisTemplate;
    private final ObjectMapper objectMapper;

    public static final String ZSET_KEY = "game:scheduled:tasks";
    public static final String PAYLOAD_KEY_PREFIX = "game:task:payload:";

    private String getGameIndexKey(String gameId) {
        return "game:tasks:" + gameId;
    }

    @Override
    public void registerTask(ScheduledGameTask task) {
        task.ensureTaskId();

        // Store the task in Redis with a score representing the execution time (current time + delay)
        long executionTime = System.currentTimeMillis() + task.getDelay().toMillis();

        String taskPayload = objectMapper.writeValueAsString(task);

        redisTemplate.opsForZSet().add(ZSET_KEY, task.getTaskId(), executionTime);
        redisTemplate.opsForValue().set(PAYLOAD_KEY_PREFIX + task.getTaskId(), taskPayload);
        redisTemplate.opsForSet().add(
                getGameIndexKey(task.getGameId()),
                task.getTaskId()
        );
    }

    @Override
    public void removeTask(ScheduledGameTask task) {
        if (task == null || task.getTaskId() == null) {
            return;
        }

        redisTemplate.opsForZSet().remove(ZSET_KEY, task.getTaskId());
        redisTemplate.delete(PAYLOAD_KEY_PREFIX + task.getTaskId());
        redisTemplate.opsForSet().remove(getGameIndexKey(task.getGameId()), task.getTaskId());
    }

    @Override
    public void removeTasksForGame(ScheduledGameTask task) {
        removeTasksForGame(task.getGameId());
    }

    @Override
    public void removeTasksForGame(String gameId) {
        String gameIndexKey = getGameIndexKey(gameId);
        var taskIds = redisTemplate.opsForSet().members(gameIndexKey);

        if (taskIds != null) {
            for (String taskId : taskIds) {
                redisTemplate.opsForZSet().remove(ZSET_KEY, taskId);
                redisTemplate.delete(PAYLOAD_KEY_PREFIX + taskId);
            }
            redisTemplate.delete(gameIndexKey);
        }
    }

    @Override
    public ScheduledGameTask getTaskById(String taskId) {
        String payload = redisTemplate.opsForValue().get(PAYLOAD_KEY_PREFIX + taskId);

        if (payload != null) {
            return objectMapper.readValue(payload, ScheduledGameTask.class);
        }

        return null;
    }


}
