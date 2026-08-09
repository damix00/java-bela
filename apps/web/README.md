# web

The Next.js client for [bela](../../README.md). Next.js 16 (App Router),
React 19, Tailwind 4, TypeScript.

Right now it serves one thing: the `belote.gg` landing page. None of the game
UI has been ported from `apps/web-deprecated` yet — see "The web rewrite" in
the root README for what that means.

## Running it

From the repo root, `pnpm dev` starts Redis, the API and this app together.
To run only the client:

```bash
pnpm dev:web          # from the root
pnpm --filter web dev # equivalent
```

Then open http://localhost:3000.

| Command          | What it does                  |
| ---------------- | ----------------------------- |
| `pnpm dev`       | Dev server (Turbopack)        |
| `pnpm build`     | Production build              |
| `pnpm start`     | Serve the production build    |
| `pnpm lint`      | ESLint (`eslint-config-next`) |
| `pnpm typecheck` | `tsc --noEmit`                |

## Design system

The look is neo-brutalist: 4px ink borders, hard offset shadows with no blur,
blocks that slide toward their own shadow on hover.

Colours, fonts and shadows live as Tailwind 4 `@theme` tokens in
`src/app/globals.css`, so `bg-cream`, `text-ink`, `shadow-hard-lg` and
`font-display` are all generated utilities. **Add a token there rather than
hardcoding a hex value in a component.**

- Palette: `ink`, `cream`, `sage`, `rust`, `forest`, plus text tints (`moss`,
  `stone`, `ember`, `mint*`, `ash`).
- Fonts: Bricolage Grotesque (`font-display`), Public Sans (`font-sans`),
  JetBrains Mono (`font-mono`), loaded via `next/font/google` in `layout.tsx`.
- Shadows: `shadow-hard-sm|hard|hard-lg|hard-xl|hard-rust`.

Primitives take a small set of named variants (`tone`, `size`, `padding`,
`shadow`) resolved through `as const` lookup maps, spread the rest of the
native element props, and merge a trailing `className` through `cn` so callers
can override. Follow that shape when adding one. Recurring class fragments
(`lift`, `focusRing`, `hatch`) belong in `src/lib/styles.ts`.

Two conventions worth knowing:

- `Heading` separates `as` (document outline) from `size` (looks) — pick the
  tag for semantics, never for type scale.
- `Section` owns the band rhythm: gutters, the 4px bottom rule, and
  `scroll-mt` for anchored sections. Full-bleed split panels pass
  `padded={false}`.

## Protocol types

`@bela/protocol` is a workspace dependency but nothing imports it yet. When the
game UI lands, import the wire types from there — do not redeclare them:

```ts
import { Suite, type CardThrownEvent } from "@bela/protocol";
```

The generated half is produced from the Java DTOs by `pnpm protocol` at the
root. Details are in the root README.
