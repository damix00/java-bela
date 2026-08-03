# Bela Monorepo Structure — Design

**Date:** 2026-08-03
**Status:** Approved

## Context

The `bela` repository already holds two applications in one git repo:

- `bela-frontend` — Next.js 16, React 19, Tailwind 4
- `bela-backend` — Spring Boot on Java 25, Gradle, Redis-backed

They share a single CI workflow but have no root-level tooling: no root
`package.json`, no combined dev command, no shared code, and no path filtering
in CI.

Separately, the web app is going to be **rewritten from scratch**. The existing
Next.js app is kept only as a reference and will not be developed further. The
new app is Next.js again — a clean slate, not a framework change. The author
will scaffold and build it themselves; this work only prepares the space for it.

## Goals

1. One-command dev and root-level build/test/lint.
2. Conventional `apps/` + `packages/` layout with real root documentation.
3. A single source of truth for the wire protocol shared between the Java
   backend and the TypeScript frontend.
4. Path-filtered CI so each job runs only when its app changes.

## Non-goals

- Scaffolding the new web app. An empty `apps/web` directory is the deliverable.
- Any change to `web-deprecated` beyond moving it.
- Turborepo or Nx. With one JS app and one package the caching and task-graph
  machinery costs more than it returns. Revisit if the package count grows.
- Containerizing the apps. Only Redis goes in Docker; both apps run natively so
  reload stays fast.

## Layout

```
bela/
├── apps/
│   ├── api/                 ← git mv bela-backend
│   ├── web/                 ← new, empty except .gitkeep
│   └── web-deprecated/      ← git mv bela-frontend, frozen
├── packages/
│   └── protocol/            ← generated TS types from the Java DTOs
├── docs/
├── compose.yaml             ← Redis only
├── package.json             ← workspaces + root scripts
├── .gitignore
├── .editorconfig
├── README.md
└── .github/workflows/ci.yml
```

All moves use `git mv` so history and blame follow the files.

Each app keeps its own `.gitignore`, `AGENTS.md`, `CLAUDE.md`, and `.env`;
these move with the app. The root `.gitignore` covers only cross-cutting
entries (`.DS_Store`, editor directories, `*.rdb`). Note that
`bela-frontend/.gitignore` uses root-anchored patterns (`/node_modules`), which
remain correct after the move because the file moves with the app.

The two tracked `.DS_Store` files (`.DS_Store` and
`bela-backend/src/main/java/pro/damjan/belabackend/.DS_Store`) are untracked as
part of this work.

## Workspaces

Root `package.json` declares:

```json
"workspaces": ["packages/*"]
```

**Not** `["apps/*", "packages/*"]`. Two constraints force this:

- `apps/*` would pull `web-deprecated` into the workspace, installing Next 16
  and React 19 at the root and folding its lockfile into the root lock — for an
  app that will never be built again. npm workspace globs have no supported
  exclusion syntax.
- `apps/web` cannot be listed yet: npm errors on a workspace path that has no
  `package.json`.

Consequence: `web-deprecated` stays self-contained with its own `node_modules`
and lockfile, and remains runnable via `npm --prefix apps/web-deprecated run dev`.

**When the new app is scaffolded, step one is adding `"apps/web"` to the
`workspaces` array.** This is documented in the root README so it is not a
surprise.

## Root scripts

| Script | Behavior |
|---|---|
| `npm run dev` | `docker compose up -d redis`, then `bootRun` + `next dev` concurrently with prefixed logs |
| `npm run dev:api` | Gradle `bootRun` only |
| `npm run dev:web` | `next dev` only |
| `npm run build` | Build both apps |
| `npm run test` | `./gradlew test` |
| `npm run lint` | ESLint in `apps/web` |
| `npm run protocol` | Regenerate `packages/protocol` from the Java DTOs |

`concurrently` is the only root dependency.

Web-facing scripts use `npm --prefix apps/web`, so they work whether or not
`apps/web` is a workspace yet. They no-op until the app is scaffolded.

`compose.yaml` defines a single Redis 7 service on port 6379 with a named
volume, matching the `REDIS_HOST` / `REDIS_PORT` / `REDIS_PASSWORD` defaults
already present in `apps/api/src/main/resources/application.properties`.

## Protocol codegen

The `cz.habarta.typescript-generator` Gradle plugin runs in `apps/api`. It
loads compiled classes and walks them using Jackson's serialization rules — the
same rules that produce the actual JSON on the wire — then emits TypeScript.

Configuration in `apps/api/build.gradle`:

- `classPatterns`: `pro.damjan.belabackend.**.dto.**`, plus the model classes
  those DTOs reference (`Card`, `Suite`, `Rank`, `GameStatus`, `Declaration`,
  `PlayedCard`, and similar).
- `outputFile`: `../../packages/protocol/src/generated.ts`
- `jsonLibrary`: `jackson2`
- `mapEnum`: `asEnum` — Java enums become TypeScript string union types.
- `outputKind`: `module`

Generated output is **checked into git**, so nothing is required at install
time and the types are readable in review.

Reading through Jackson matters for correctness: `Card.isTrump` is a Java field
with a Lombok `isTrump()` getter, which Jackson serializes as `trump`. A
generator cannot get that wrong; a human writing types by hand can.

`packages/protocol/src/index.ts` is hand-written. It re-exports `generated.ts`
and adds the one thing reflection cannot see: the mapping from `eventName`
string to event type. Event names such as `"game:cardThrown"` live inside
constructor calls (`super("game:cardThrown")`), invisible to class reflection.
This is a discriminated union of roughly 40 lines, maintained by hand as events
are added.

The package is named `@bela/protocol` and is consumed as
`import type { CardThrownEvent } from "@bela/protocol"`.

### Risk: Java 25 compatibility

`typescript-generator` is a reflection-based tool and JDK 25 is very new. Its
compatibility with Java 25 is **unverified**.

Verifying that the plugin generates real output is the **first implementation
step**, before any other codegen work. If the plugin cannot run on Java 25, stop
and report back rather than silently substituting a different tool — the choice
of approach is the author's to make.

## CI

`.github/workflows/ci.yml` gains path filtering and one new job:

- **api** — triggers on `apps/api/**`. Gradle test, unchanged from today apart
  from the working directory.
- **protocol** — triggers on `apps/api/**`. Runs the generator, then
  `git diff --exit-code packages/protocol`. A DTO change committed without
  regenerated types fails the build.
- **web** — triggers on `apps/web/**`. Lint, `tsc --noEmit`, build.

`web-deprecated` is removed from CI entirely.

**Accepted gap:** CI has no frontend coverage until the new app exists. The
`web` job never triggers on an empty directory. This is correct behavior given
there is no frontend to test, but it is a real gap during the rewrite.

## Verification

- `npm run dev` starts Redis, the API, and (once scaffolded) the web app.
- `./gradlew test` passes from `apps/api`.
- `npm run protocol` produces a non-empty `generated.ts` containing `Suite`,
  `Card`, and the outgoing event interfaces.
- Running `npm run protocol` twice produces no git diff on the second run.
- `git log --follow` works across the moved files.
