# AGENTS.md

## Build & Run

```bash
./gradlew build        # Build the project
./gradlew test         # Run tests
./gradlew bootRun      # Run the application
```

Java 25 via Gradle toolchain. Spring Boot 4.0.3.

## Architecture

This is a **Belote card game backend** using Spring Boot, WebSockets, Redis, and PostgreSQL.

### WebSocket Event System

The project uses a custom event-driven WebSocket system instead of Spring's standard messaging:

- **`@OnEvent("event:name")`** annotation marks handler methods (see `LobbyEventHandler`, `BeloteGameEventHandler`)
- **`WebSocketEventRegistry`** scans all beans for `@OnEvent` at startup and builds a dispatch map
- **`GameWebSocketHandler`** receives WebSocket messages (`{event, body}` JSON), dispatches to registered handlers
- Handler method parameters are auto-injected: `UserSession`, `User`, and any `IncomingEvent` subclass (deserialized from body)
- Event classes' fields are never final, and always need setters and a no-arg constructor for Jackson deserialization

### Message Broker (Redis Pub/Sub)

`RedisMessageBroker` implements `MessageBroker` for delivering outgoing events to users across server instances:
- Channel pattern: `user:{userId}` or `user:{userId}:session:{sessionId}`
- `RedisMessageListener` picks up messages and forwards to the correct local WebSocket session

### Scheduled Task System

Game tasks (e.g., `RoundStartTask`) are scheduled via Redis ZSET:
- `RedisScheduledTaskRegistry` stores tasks with execution timestamps in `game:scheduled:tasks`
- `RedisScheduledTaskPoller` polls every 500ms, extracts due tasks via Lua script
- `ScheduledTaskDispatcher` routes tasks to the appropriate handler

### Data Flow: Lobby → Game

1. Player creates lobby via `lobby:create` → gets assigned seat 0 as host
2. Others join via invite code (`lobby:join:code`) → fill seats 1-3
3. All players set ready (`lobby:ready`) → if full + all ready, `LobbyService.createGame()` is called
4. `BeloteGameService.createGame()` maps `LobbyPlayer` → `GamePlayer`, pairs into teams, saves to Redis
5. Frontend loads game, sends `game:loaded` → when all 4 loaded, game starts and first round is scheduled

### Key Models (Redis)

- **`Lobby`** — 4-seat map (`Map<Integer, LobbyPlayer>`), invite code, status (IN_LOBBY/IN_GAME)
- **`BeloteGame`** — two `Team`s, rounds, status (WAITING/IN_PROGRESS/FINISHED)
- **`GamePlayer`** — userId, seatIndex, hand of cards, bot flag
- **`UserPresence`** — tracks lobbyId, gameId, last ping time

### Team Pairing

Seats 0,2 → Team A; Seats 1,3 → Team B (via `Team.pairFrom()`)

## Packages

- `websocket/` — WebSocket config, handler, custom @OnEvent registry and dispatch
- `game/` — Game models, services, event handlers, scheduling
- `lobby/` — Lobby models, services, event handlers
- `user/` — User entity, auth (JWT + anonymous), presence tracking, session management
- `security/` — JWT filters, rate limiting (Bucket4j), CORS config
- `messaging/` — Redis pub/sub message broker abstraction
- `redis/` — Redis configuration

## Configuration

Configured via `application.properties` with env vars:
- `DB_URL`, `DB_USERNAME`, `DB_PASSWORD` — PostgreSQL
- `JWT_SECRET` — JWT signing key
- `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD` — Redis
- `FRONTEND_DOMAIN`, `BACKEND_DOMAIN` — CORS origins