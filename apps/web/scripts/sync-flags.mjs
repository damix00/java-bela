// Copies the flag SVGs this app can render out of `@twemoji/svg` and into
// `public/flags/`, one file per country in `COUNTRY_CODES`.
//
// Twemoji rather than the system emoji font, because a flag is the one emoji
// platforms disagree about outright: Windows ships no flag glyphs at all and
// draws the two letters of the country code instead, which lands as "HR" beside
// a heading that already says Croatia. One set of drawings, the same on every
// machine.
//
// Copied rather than imported. These are `<img src>` targets — the picker's
// list, the profile banner — so they have to be reachable as URLs, and only
// `public/` is. Copied rather than *committed* because the package is the
// source of truth: 200 vendored SVGs in the repo would be a second copy to keep
// in step with a dependency that already has them.
//
// Runs on `postinstall`, and by hand as `pnpm flags`. The output is gitignored.

import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const out = join(root, "public", "flags");

// The package is a flat directory of `<codepoints>.svg` with a `package.json`
// at the top, so resolving that is how to find the rest of it.
const assets = dirname(require.resolve("@twemoji/svg/package.json"));

/**
 * The country list, read out of the TypeScript module rather than duplicated
 * here — a second list would drift the moment someone adds a country.
 */
const source = await readFile(join(root, "src", "lib", "i18n", "countries.ts"), "utf8");
const codes = [...source.matchAll(/^\s{4}"([A-Z]{2})",$/gm)].map((match) => match[1]);

if (codes.length < 100) {
    throw new Error(`Only found ${codes.length} country codes — has COUNTRY_CODES moved?`);
}

/** `HR` → `1f1ed-1f1f7`, the regional-indicator pair Twemoji names its files by. */
function codepoints(code) {
    return [...code]
        .map((letter) => (0x1f1e6 + letter.charCodeAt(0) - 65).toString(16))
        .join("-");
}

await rm(out, { recursive: true, force: true });
await mkdir(out, { recursive: true });

const missing = [];

await Promise.all(
    codes.map(async (code) => {
        try {
            const svg = await readFile(join(assets, `${codepoints(code)}.svg`));
            await writeFile(join(out, `${code}.svg`), svg);
        } catch {
            // Twemoji has no drawing for a handful of the codes on our list —
            // `XK` most notably, which has no flag emoji to draw. The picker
            // falls back to a blank tile, which is better than a broken image
            // and better than dropping the country.
            missing.push(code);
        }
    }),
);

console.log(
    `flags: wrote ${codes.length - missing.length} to public/flags` +
        (missing.length ? ` (no drawing for ${missing.join(", ")})` : ""),
);
