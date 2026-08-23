# bela

A real-time, multiplayer [Belote](https://en.wikipedia.org/wiki/Belote) (bela)
card game. The repository contains a Spring Boot API, a Next.js web client,
and a shared TypeScript wire protocol.

The current app supports guest and registered sessions, English and Croatian,
invite-code lobbies, seat and team management, and a playable four-player game
over WebSockets.

## Layout

```
apps/
  api/              Spring Boot, Java 25, Gradle. PostgreSQL + Redis.
  web/              Next.js 16 client (App Router, Tailwind 4, TypeScript).
  web-deprecated/   The previous Next.js client. Reference only, frozen.
packages/
  protocol/         TypeScript wire types, generated from the Java DTOs.
```

The workspace is managed with **pnpm**. `apps/web-deprecated` is deliberately
excluded from it (see `pnpm-workspace.yaml`) so its dependency tree is never
installed; it still runs standalone on npm from its own directory.

## Prerequisites

- JDK 25 (Gradle can auto-provision it if missing)
- Node.js 22+ and pnpm 11
- Docker, for Redis
- Postgres on `localhost:5432` (database `bela`)

## Getting started

1. Create a PostgreSQL database named `bela`.
2. Configure the API in `apps/api/.env`:

   ```dotenv
   DB_USERNAME=postgres
   DB_PASSWORD=password
   INTERNAL_API_KEY=replace-with-a-shared-secret
   ```

   `DB_URL`, JWT lifetimes and secrets, Redis, and frontend/backend origins also
   have environment-variable overrides; their development defaults are in
   `apps/api/src/main/resources/application.properties`.

3. Configure the web client:

   ```bash
   cp apps/web/.env.example apps/web/.env.local
   ```

   Set `INTERNAL_API_KEY_SB` to the same value as the API's
   `INTERNAL_API_KEY`.

4. Install dependencies and start the stack:

```bash
pnpm install
pnpm dev
```

`pnpm dev` starts Redis in Docker, then runs the API and the web client
together with prefixed logs. Open http://localhost:3000. The API listens on
http://localhost:8080 and its WebSocket endpoint is `ws://localhost:8080/ws`.

| Command | What it does |
|---|---|
| `pnpm dev` | Redis + API + web |
| `pnpm dev:api` | API only |
| `pnpm dev:web` | Web only |
| `pnpm build` | Build both apps |
| `pnpm test` | API test suite |
| `pnpm lint` | Lint the web app |
| `pnpm typecheck` | Type check every workspace package |
| `pnpm protocol` | Regenerate `packages/protocol` from the Java DTOs |
| `pnpm redis:up` / `redis:down` | Redis lifecycle |

To run the frozen client independently, use npm from `apps/web-deprecated`.

## Architecture

- **Web:** Next.js App Router and React 19. Server actions and the refresh-token
  route act as a small backend-for-frontend; authenticated API and WebSocket
  traffic use short-lived access tokens in the browser.
- **API:** Spring Boot 4 with Spring Security, JPA, PostgreSQL, Redis, and raw
  WebSockets. PostgreSQL stores users and sessions; Redis stores live game
  state and carries cross-instance messages.
- **Protocol:** `@bela/protocol` gives the client generated DTOs plus typed
  client/server event maps.

Most lobby and game operations are WebSocket events. REST endpoints handle
authentication and user lookup.

## The protocol package

`packages/protocol/src/generated.ts` is produced by a Gradle task in `apps/api`
that reads the DTO classes through Jackson's serialization rules, so the
TypeScript property names match what actually goes over the wire. It is checked
into git — never edit it by hand.

**After changing any Java DTO, run `pnpm protocol` and commit the result.**
CI regenerates and fails on a diff, so stale types cannot merge.

Consume it from the web app with `import { Suite, type CardThrownEvent } from
"@bela/protocol"`. The package ships raw TypeScript rather than compiled
output; Turbopack and `tsc` both handle that without `transpilePackages`,
including the runtime enums.

`packages/protocol/src/index.ts` is hand-maintained. It holds the event-name to
payload mapping (`ServerEvents`, `ClientEvents`), which reflection cannot
discover because event names live inside constructor calls and `@OnEvent`
annotations. Add new events there by hand.

Note the WebSocket envelopes are asymmetric: server frames are
`{"event": name, "data": payload}`, client frames are
`{"event": name, "body": payload}`.

## Web client

Routes are locale-prefixed (`/en`, `/hr`). The public landing and legal pages,
authentication flows, lobby table, and live game UI are implemented in
`apps/web`. Translation dictionaries live in `apps/web/src/dictionaries`.

The UI uses Tailwind 4 theme tokens defined in `apps/web/src/app/globals.css`.
See `apps/web/README.md` for its design-system and component conventions.

## Java 25 note

The TypeScript generator reads compiled class files, so the Gradle **daemon**
must run on Java 25 — the toolchain setting alone is not enough. This is pinned
in `apps/api/gradle/gradle-daemon-jvm.properties`. Do not remove it, or
`generateTypeScript` fails with "class file version 69.0".
