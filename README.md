# bela

Belote (bela) card game — a Spring Boot API and a Next.js web client.

## Layout

```
apps/
  api/              Spring Boot, Java 25, Gradle. Redis-backed game state.
  web/              The new web client. Empty — to be built.
  web-deprecated/   The previous Next.js client. Reference only, frozen.
packages/
  protocol/         TypeScript wire types, generated from the Java DTOs.
```

## Prerequisites

- JDK 25 (Gradle auto-provisions it if missing)
- Node.js 22+
- Docker, for Redis

## Getting started

```bash
npm install
npm run dev
```

`npm run dev` starts Redis in Docker, then runs the API and the web client
together with prefixed logs. Until `apps/web` exists, only the API starts.

| Command | What it does |
|---|---|
| `npm run dev` | Redis + API + web |
| `npm run dev:api` | API only |
| `npm run dev:web` | Web only |
| `npm run build` | Build both apps |
| `npm test` | API test suite |
| `npm run lint` | Lint the web app |
| `npm run protocol` | Regenerate `packages/protocol` from the Java DTOs |
| `npm run redis:up` / `redis:down` | Redis lifecycle |

## The protocol package

`packages/protocol/src/generated.ts` is produced by a Gradle task in `apps/api`
that reads the DTO classes through Jackson's serialization rules, so the
TypeScript property names match what actually goes over the wire. It is checked
into git — never edit it by hand.

**After changing any Java DTO, run `npm run protocol` and commit the result.**
CI regenerates and fails on a diff, so stale types cannot merge.

`packages/protocol/src/index.ts` is hand-maintained. It holds the event-name to
payload mapping (`ServerEvents`, `ClientEvents`), which reflection cannot
discover because event names live inside constructor calls and `@OnEvent`
annotations. Add new events there by hand.

Note the WebSocket envelopes are asymmetric: server frames are
`{"event": name, "data": payload}`, client frames are
`{"event": name, "body": payload}`.

## Starting the web rewrite

`apps/web` is intentionally empty. When you scaffold the new app:

1. Add `"apps/web"` to the `workspaces` array in the root `package.json`. It is
   omitted today because npm errors on a workspace path with no `package.json`.
2. Add `"@bela/protocol": "*"` to the new app's dependencies.

`web-deprecated` is deliberately **not** a workspace — an `apps/*` glob would
pull its dependency tree into the root install for an app that is never built
again. It still runs standalone via
`npm --prefix apps/web-deprecated run dev`.

## Java 25 note

The TypeScript generator reads compiled class files, so the Gradle **daemon**
must run on Java 25 — the toolchain setting alone is not enough. This is pinned
in `apps/api/gradle/gradle-daemon-jvm.properties`. Do not remove it, or
`generateTypeScript` fails with "class file version 69.0".
