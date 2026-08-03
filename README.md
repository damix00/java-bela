# bela

Belote (bela) card game — a Spring Boot API and a Next.js web client.

## Layout

```
apps/
  api/              Spring Boot, Java 25, Gradle. Redis-backed game state.
  web/              Next.js 16 client (App Router, Tailwind 4, TypeScript).
  web-deprecated/   The previous Next.js client. Reference only, frozen.
packages/
  protocol/         TypeScript wire types, generated from the Java DTOs.
```

The workspace is managed with **pnpm**. `apps/web-deprecated` is deliberately
excluded from it (see `pnpm-workspace.yaml`) so its dependency tree is never
installed; it still runs standalone on npm from its own directory.

## Prerequisites

- JDK 25 (Gradle auto-provisions it if missing)
- Node.js 22+ and pnpm 10+
- Docker, for Redis
- Postgres on `localhost:5432` (database `bela`)

## Getting started

```bash
pnpm install
pnpm dev
```

`pnpm dev` starts Redis in Docker, then runs the API and the web client
together with prefixed logs.

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

## The web rewrite

`apps/web` is a bare `create-next-app` scaffold — TypeScript, App Router,
Tailwind 4, ESLint, `src/`, `@/*` alias — matching the stack of the app it
replaces. Nothing has been ported from `web-deprecated`; that is deliberate.

Two differences from the old app worth knowing:

- The React Compiler is **off**. The old app enabled it via
  `babel-plugin-react-compiler`. Add `reactCompiler: true` to `next.config.ts`
  if you want it back.
- `sharp` and `unrs-resolver` are left unbuilt (`allowBuilds` in
  `pnpm-workspace.yaml`), which is create-next-app's default. Lint and
  production builds both pass without them. Flip to `true` if you hit image
  optimization limits in production.

## Java 25 note

The TypeScript generator reads compiled class files, so the Gradle **daemon**
must run on Java 25 — the toolchain setting alone is not enough. This is pinned
in `apps/api/gradle/gradle-daemon-jvm.properties`. Do not remove it, or
`generateTypeScript` fails with "class file version 69.0".
