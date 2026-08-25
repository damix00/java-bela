# Private table target score picker

Date: 2026-08-25
Status: approved
Scope: `apps/web` only — no backend changes.

## Problem

A private table's target score is fixed at 501. The backend already accepts any
`targetScore > 0` for private tables (`GameConfiguration.forMatchType` passes
private points straight through; ranked stays 1001 and casual stays 501), and
the `lobby:changeConfig` command already carries a `points` field read only for
`PRIVATE`. The client hardcodes the value in `apps/web/src/context/lobby-context.tsx`
(`PRIVATE_TARGET_SCORE = 501`) because there is no control for it.

The host should be able to play a private table to 301, 501, 701, or 1001.

## Decisions

1. **UI shape** — the four scores are segmented buttons rendered *inside* the
   Private option row of the existing table-rules listbox. No new control, no
   new grid cell.
2. **Visibility** — the buttons appear only while the dropdown is open **and**
   the table is currently Private. When ranked or casual is active, the Private
   row stays compact as today.
3. **Anytime** — while Private is selected the host can reopen the menu at any
   time and switch scores; no need to re-pick Private first.
4. **Host-only** — unchanged. Non-hosts still get plain text instead of the
   control (backend refuses non-host config changes with
   `PlayerNotHostException`).
5. **Closed-control label** — when the table is private, the closed face reads
   "Private" with subtitle "to {score} · invite only · your rules", so everyone
   at the table sees the target without opening the menu. Non-hosts see this
   same face as plain text.
6. **Default** — 501 remains the default for a newly created private table
   (`LobbyService.createLobby` sets it) and when the host picks Private without
   touching the score buttons.

## Design

### Data flow (`lobby-context.tsx`)

- `setMatchType(matchType)` gains an optional second argument:
  `setMatchType(matchType, points?)`. When omitted, points default to
  `PRIVATE_TARGET_SCORE` (501), so existing ranked/casual call sites are
  unchanged.
- The displayed score is read from `lobby.gameConfiguration.targetScore`, which
  is already the source of truth: the existing `lobby:configChanged` handler
  patches it in, including for the host's own change (it round-trips through
  the backend like everyone else's). No new client state.

### UI (`TableRules.tsx`)

- The rules list keeps its three entries: Ranked / Casual / Private.
- While open with a Private table: the Private row renders a segmented button
  group — 301 · 501 · 701 · 1001 — beneath its title/note. The current target
  is highlighted, matching the row's active/selected styling language.
- Pressing a point sends `setMatchType(MatchType.PRIVATE, n)` and closes the
  menu.
- Clicks and keydowns on the point buttons stop propagation so they do not fall
  through to the listbox's option-select handlers (an Enter on a focused point
  button must not also commit the whole Private row).
- The guest-ranked gate is unaffected: Private stays available to guests.

### Copy & i18n (`en.json`, `hr.json`)

- `rules.private.note` becomes parameterized: "to {score} · invite only · your
  rules" (and the Croatian equivalent), filled from
  `lobby.gameConfiguration.targetScore`.
- New accessible label for the point group ("Play to" / Croatian equivalent) so
  screen readers announce what the buttons set.
- Dictionary types follow from the JSON files.

## Error handling

- No new failure modes. A refused change still arrives as a `lobby:*` socket
  error surfaced by the existing error path in the lobby band; the control
  itself never moves ahead of the backend's confirmation.

## Verification

- No frontend test framework exists in `apps/web`. Verification is
  `pnpm lint` + `pnpm typecheck`, plus a manual check against a running dev
  server: pick Private, confirm 501 default, switch to each of 301/701/1001,
  confirm the closed label updates after the round-trip, confirm keyboard
  operation, and confirm a non-host sees "to {score}" without controls.
