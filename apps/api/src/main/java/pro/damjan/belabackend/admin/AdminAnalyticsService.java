package pro.damjan.belabackend.admin;

import org.springframework.stereotype.Service;
import pro.damjan.belabackend.admin.dto.response.AdminAnalyticsResponse;
import pro.damjan.belabackend.admin.dto.response.LiveActivityAnalyticsResponse;
import pro.damjan.belabackend.admin.dto.response.UserAnalyticsResponse;
import pro.damjan.belabackend.game.model.BeloteGame;
import pro.damjan.belabackend.game.model.GameStatus;
import pro.damjan.belabackend.game.repository.BeloteGameRepository;
import pro.damjan.belabackend.lobby.model.Lobby;
import pro.damjan.belabackend.lobby.model.LobbyStatus;
import pro.damjan.belabackend.lobby.repository.LobbyRepository;
import pro.damjan.belabackend.user.UserRepository;
import pro.damjan.belabackend.user.auth.AuthProvider;
import pro.damjan.belabackend.user.auth.Role;
import pro.damjan.belabackend.user.presence.session.SessionRepository;
import pro.damjan.belabackend.user.presence.session.UserSession;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Objects;
import java.util.stream.StreamSupport;

@Service
public class AdminAnalyticsService {

    private final UserRepository userRepository;
    private final SessionRepository sessionRepository;
    private final LobbyRepository lobbyRepository;
    private final BeloteGameRepository gameRepository;
    private final Clock clock;

    public AdminAnalyticsService(UserRepository userRepository,
                                 SessionRepository sessionRepository,
                                 LobbyRepository lobbyRepository,
                                 BeloteGameRepository gameRepository,
                                 Clock clock) {
        this.userRepository = userRepository;
        this.sessionRepository = sessionRepository;
        this.lobbyRepository = lobbyRepository;
        this.gameRepository = gameRepository;
        this.clock = clock;
    }

    public AdminAnalyticsResponse snapshot() {
        Instant now = clock.instant();
        List<UserSession> sessions = listOf(sessionRepository.findAll());
        List<Lobby> lobbies = listOf(lobbyRepository.findAll());
        List<BeloteGame> games = listOf(gameRepository.findAll());

        return AdminAnalyticsResponse.builder()
                .generatedAt(now)
                .users(userSnapshot(now))
                .activity(activitySnapshot(sessions, lobbies, games))
                .build();
    }

    private UserAnalyticsResponse userSnapshot(Instant now) {
        return UserAnalyticsResponse.builder()
                .total(userRepository.count())
                .registered(userRepository.countByAuthProvider(AuthProvider.LOCAL))
                .guests(userRepository.countByAuthProvider(AuthProvider.ANONYMOUS))
                .admins(userRepository.countByRole(Role.ADMIN))
                .registeredLast24Hours(countRegisteredSince(now.minus(Duration.ofHours(24))))
                .registeredLast7Days(countRegisteredSince(now.minus(Duration.ofDays(7))))
                .registeredLast30Days(countRegisteredSince(now.minus(Duration.ofDays(30))))
                .build();
    }

    private long countRegisteredSince(Instant cutoff) {
        return userRepository.countByAuthProviderAndCreatedAtGreaterThanEqual(AuthProvider.LOCAL, cutoff);
    }

    private static LiveActivityAnalyticsResponse activitySnapshot(List<UserSession> sessions,
                                                                    List<Lobby> lobbies,
                                                                    List<BeloteGame> games) {
        long connectedUsers = sessions.stream()
                .map(UserSession::getUserId)
                .filter(Objects::nonNull)
                .distinct()
                .count();

        return LiveActivityAnalyticsResponse.builder()
                .connectedUsers(connectedUsers)
                .sessions(sessions.size())
                .lobbiesTotal(lobbies.size())
                .lobbiesInLobby(countLobbies(lobbies, LobbyStatus.IN_LOBBY))
                .lobbiesMatchmaking(countLobbies(lobbies, LobbyStatus.MATCHMAKING))
                .lobbiesInGame(countLobbies(lobbies, LobbyStatus.IN_GAME))
                .gamesTotal(games.size())
                .gamesWaiting(countGames(games, GameStatus.WAITING))
                .gamesInProgress(countGames(games, GameStatus.IN_PROGRESS))
                .gamesFinished(countGames(games, GameStatus.FINISHED))
                .build();
    }

    private static long countLobbies(List<Lobby> lobbies, LobbyStatus status) {
        return lobbies.stream().filter(lobby -> lobby.getStatus() == status).count();
    }

    private static long countGames(List<BeloteGame> games, GameStatus status) {
        return games.stream().filter(game -> game.getStatus() == status).count();
    }

    private static <T> List<T> listOf(Iterable<T> values) {
        return StreamSupport.stream(values.spliterator(), false).toList();
    }
}
