package pro.damjan.belabackend.game.service.play;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import pro.damjan.belabackend.game.events.BeloteGameEventPublisher;
import pro.damjan.belabackend.game.model.BeloteGame;
import pro.damjan.belabackend.game.model.GameStatus;
import pro.damjan.belabackend.game.scheduling.registry.ScheduledTaskRegistry;
import pro.damjan.belabackend.game.scheduling.tasks.ScheduledGameTask;
import pro.damjan.belabackend.game.scheduling.tasks.ScheduledTaskType;
import pro.damjan.belabackend.game.service.access.GameAccessService;

import java.time.Duration;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class GameFlowService {

    private static final Duration NEXT_ROUND_DELAY = Duration.ofSeconds(5);

    private final GameAccessService gameAccessService;
    private final BeloteGameEventPublisher gamePublisher;
    private final ScheduledTaskRegistry scheduledTaskRegistry;

    public void endGameOrScheduleNextRound(BeloteGame game, int finishedRoundNumber) {
        if (endGameIfWon(game)) return;
        scheduleNextRoundStart(game, finishedRoundNumber + 1);
    }

    public void scheduleNextRoundStart(BeloteGame game, int nextRoundNumber) {
        scheduledTaskRegistry.registerTask(
                new ScheduledGameTask(
                        ScheduledTaskType.ROUND_START_TASK,
                        NEXT_ROUND_DELAY,
                        game.getId(),
                        Map.of("roundNumber", nextRoundNumber)
                )
        );
    }

    private boolean endGameIfWon(BeloteGame game) {
        if (!game.hasWinner()) return false;

        game.setStatus(GameStatus.FINISHED);
        gameAccessService.save(game);
        gamePublisher.gameEnded(game);
        return true;
    }
}
