"use client";

import { Check, ChevronDown, Search } from "lucide-react";
import { useEffect, useId, useMemo, useRef, useState } from "react";

import Flag from "@/components/ui/graphics/Flag";
import type { CountryOption } from "@/lib/i18n/countries";
import { cn } from "@/lib/ui/cn";
import {
    feltInputBox,
    focusRing,
    inputBox,
    panel,
    type Surface,
} from "@/lib/ui/styles";

type CountrySelectProps = {
    id: string;
    /** ISO alpha-2, or `""` for the country nobody has picked. */
    value: string;
    onChange: (code: string) => void;
    /** Built on the server — see `countryOptions`. */
    countries: CountryOption[];
    /** What the empty choice is called, and the first row in the list. */
    noneLabel: string;
    /** Placeholder for the filter box. */
    searchLabel: string;
    /** Said when the filter matches nothing. */
    emptyLabel: string;
    surface?: Surface;
};

/**
 * The country picker.
 *
 * This was a native `<select>` of nearly two hundred options, which is the one
 * shape a native select is worst at: no flags, no way to search beyond the
 * browser's own type-ahead resetting itself after a second, and on a desktop a
 * scrolling column the length of the screen. It is also the only control on the
 * page the browser drew in its own voice — a grey double chevron next to four
 * pixels of ink border.
 *
 * So: a button that opens a listbox with a filter at the top. The filter is the
 * point. Two hundred options is a search problem, and typing "cro" is how
 * anyone actually finds Croatia.
 *
 * Kept deliberately plain in one respect — the value is a string in and a
 * string out, so it drops into `react-hook-form`'s `Controller` exactly where
 * the `<select>` sat, and the form knows nothing about any of this.
 *
 * Keyboard: the trigger opens on Enter, Space or ↓. Inside, ↑/↓ walk the list,
 * Enter takes the highlighted row, Escape closes without changing anything, and
 * Tab is left alone so the field can be left the way every other field can.
 */
export default function CountrySelect({
    id,
    value,
    onChange,
    countries,
    noneLabel,
    searchLabel,
    emptyLabel,
    surface = "brut",
}: CountrySelectProps) {
    const felt = surface === "felt";
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState("");
    const [active, setActive] = useState(0);

    const listId = useId();
    const root = useRef<HTMLDivElement>(null);
    const searchBox = useRef<HTMLInputElement>(null);
    const list = useRef<HTMLUListElement>(null);

    const selected =
        countries.find((country) => country.code === value) ?? null;

    // The empty choice is a row in the list rather than a cleared field: "rather
    // not say" is a thing a player chooses, and a picker you cannot un-pick
    // would make the country the one profile field that is permanent.
    const rows = useMemo(() => {
        const all: CountryOption[] = [
            { code: "", name: noneLabel },
            ...countries,
        ];
        const needle = query.trim().toLocaleLowerCase();
        if (!needle) return all;

        return all.filter(
            (country) =>
                country.name.toLocaleLowerCase().includes(needle) ||
                country.code.toLocaleLowerCase() === needle,
        );
    }, [countries, noneLabel, query]);

    // The highlight is clamped on the way out rather than corrected in an
    // effect: a filter that has just narrowed the list leaves `active` pointing
    // past the end of it, and storing the correction would be a second render
    // to say what this line says for free.
    const activeRow = Math.min(active, Math.max(0, rows.length - 1));

    // Moving focus is the effect's proper job — synchronising React with a
    // platform API. Nothing here sets state, which is what the compiler's rule
    // is actually about.
    useEffect(() => {
        if (open) searchBox.current?.focus();
    }, [open]);

    // Keeps the highlighted row on screen while the arrows walk past the fold.
    useEffect(() => {
        if (!open) return;

        list.current?.children[activeRow]?.scrollIntoView({ block: "nearest" });
    }, [activeRow, open]);

    /**
     * Opening lands on whatever is currently picked, so the list opens showing
     * where you are rather than at Andorra. Done here rather than in an effect
     * watching `open`, because it is a consequence of the click, not of the
     * state settling afterwards — and `rows` at this moment is the unfiltered
     * list, since the query is being cleared in the same breath.
     */
    function openList() {
        setQuery("");
        setActive(value ? countries.findIndex((c) => c.code === value) + 1 : 0);
        setOpen(true);
    }

    // A picker left open behind a click elsewhere is a panel the page has to
    // draw around; closing on outside pointer-down is what every select does.
    useEffect(() => {
        if (!open) return;

        function onPointerDown(event: PointerEvent) {
            if (!root.current?.contains(event.target as Node)) setOpen(false);
        }

        document.addEventListener("pointerdown", onPointerDown);
        return () => document.removeEventListener("pointerdown", onPointerDown);
    }, [open]);

    function pick(code: string) {
        onChange(code);
        setOpen(false);
    }

    function onKeyDown(event: React.KeyboardEvent) {
        if (event.key === "Escape") {
            setOpen(false);
            return;
        }

        if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            event.preventDefault();

            if (!open) {
                openList();
                return;
            }

            const next = activeRow + (event.key === "ArrowDown" ? 1 : -1);
            setActive(
                next < 0 ? rows.length - 1 : next >= rows.length ? 0 : next,
            );
            return;
        }

        if (event.key === "Enter" && open) {
            event.preventDefault();
            const row = rows[activeRow];
            if (row) pick(row.code);
        }
    }

    return (
        <div ref={root} className="relative" onKeyDown={onKeyDown}>
            <button
                id={id}
                type="button"
                aria-expanded={open}
                aria-controls={open ? listId : undefined}
                aria-haspopup="listbox"
                onClick={() => (open ? setOpen(false) : openList())}
                className={cn(
                    focusRing,
                    "flex cursor-pointer items-center gap-3 text-left",
                    felt
                        ? feltInputBox
                        : [inputBox, "bg-white", open && "bg-paper"],
                )}
            >
                {/* Fixed slot rather than a bare `Flag`, so the name starts in
                    the same place whether or not there is a flag to draw. */}
                <span className="flex w-7 shrink-0 justify-center">
                    <Flag code={selected?.code ?? null} size="sm" />
                </span>
                <span className="min-w-0 flex-1 truncate">
                    {selected ? selected.name : noneLabel}
                </span>
                <ChevronDown
                    aria-hidden="true"
                    strokeWidth={3}
                    className={cn(
                        "size-5 shrink-0 transition-transform duration-150 motion-reduce:transition-none",
                        open && "rotate-180",
                    )}
                />
            </button>

            {open && (
                // Laid over the page rather than pushing it: the field sits in
                // the middle of a form, and a panel that reflowed everything
                // under it would move the save button out from under the cursor.
                <div
                    className={cn(
                        "absolute top-[calc(100%+6px)] right-0 left-0 z-20 flex max-h-[320px] flex-col",
                        felt
                            ? `${panel} overflow-hidden`
                            : "border-4 border-ink bg-paper shadow-hard",
                    )}
                >
                    <div
                        className={cn(
                            "flex items-center gap-2 px-4 py-3",
                            felt
                                ? "border-b border-mint/15"
                                : "border-b-4 border-ink bg-cream",
                        )}
                    >
                        <Search
                            aria-hidden="true"
                            strokeWidth={3}
                            className="size-4 shrink-0 text-stone"
                        />
                        <input
                            ref={searchBox}
                            type="text"
                            value={query}
                            onChange={(event) => {
                                setQuery(event.target.value);
                                // A new filter is a new list, and the highlight
                                // belongs on its first row.
                                setActive(0);
                            }}
                            placeholder={searchLabel}
                            role="combobox"
                            aria-label={searchLabel}
                            aria-expanded="true"
                            aria-controls={listId}
                            // Focus stays in the filter box while the arrows
                            // walk the list, so this is the only thing telling
                            // a screen reader which row is being walked past.
                            aria-activedescendant={
                                rows[activeRow]
                                    ? optionId(listId, activeRow)
                                    : undefined
                            }
                            autoComplete="off"
                            className={cn(
                                "w-full min-w-0 border-none bg-transparent font-sans text-[16px] outline-none",
                                felt
                                    ? "text-cream placeholder:text-mint/40"
                                    : "text-ink placeholder:text-stone/70",
                            )}
                        />
                    </div>

                    {rows.length === 0 ? (
                        <p className="m-0 px-4 py-5 text-[15px] text-moss">
                            {emptyLabel}
                        </p>
                    ) : (
                        <ul
                            ref={list}
                            id={listId}
                            role="listbox"
                            aria-label={searchLabel}
                            className="m-0 flex-1 list-none overflow-y-auto p-0"
                        >
                            {rows.map((country, index) => {
                                const picked = country.code === value;

                                return (
                                    <li key={country.code || "none"}>
                                        <button
                                            type="button"
                                            id={optionId(listId, index)}
                                            role="option"
                                            aria-selected={picked}
                                            onClick={() => pick(country.code)}
                                            onPointerMove={() =>
                                                setActive(index)
                                            }
                                            className={cn(
                                                "flex w-full cursor-pointer items-center gap-3 border-none px-4 py-[10px] text-left font-sans text-[16px]",
                                                felt
                                                    ? "text-cream"
                                                    : "text-ink",
                                                index === activeRow
                                                    ? felt
                                                        ? "bg-mint/10"
                                                        : "bg-sage"
                                                    : "bg-transparent",
                                            )}
                                        >
                                            <span className="flex w-7 shrink-0 justify-center">
                                                <Flag
                                                    code={country.code || null}
                                                />
                                            </span>
                                            <span className="min-w-0 flex-1 truncate">
                                                {country.name}
                                            </span>
                                            {picked && (
                                                <Check
                                                    aria-hidden="true"
                                                    strokeWidth={3}
                                                    className="size-4 shrink-0 text-rust"
                                                />
                                            )}
                                        </button>
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </div>
            )}
        </div>
    );
}

/** Stable id per row, for `aria-activedescendant` to point at. */
function optionId(listId: string, index: number) {
    return `${listId}-option-${index}`;
}
