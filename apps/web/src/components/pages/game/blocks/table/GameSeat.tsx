import Image from "next/image";

import { cn } from "@/lib/ui/cn";

type GameSeatProps = {
    name: string;
    avatarUrl: string | null;
    /** Theirs to act — the only state on this screen that has to be unmissable. */
    active: boolean;
    /** They took the trick now sitting on the felt. */
    won: boolean;
    /** Wide sits across/near, square on the sides, inline below the hand. */
    variant: "wide" | "square" | "inline";
    /** Suffix for the seat that is you. */
    youLabel?: string;
    wonLabel: string;
};

/** A player reduced to the two things needed during play: face and name. */
export default function GameSeat({
    name,
    avatarUrl,
    active,
    won,
    variant,
    youLabel,
    wonLabel,
}: GameSeatProps) {
    return (
        <div
            data-game-seat=""
            aria-label={won ? `${name} · ${wonLabel}` : name}
            className={cn(
                "flex h-full w-full min-w-0 items-center justify-center text-center",
                variant === "inline"
                    ? "flex-row gap-2 py-0.5"
                    : "flex-col gap-1",
                variant === "wide"
                    ? "py-0.5"
                    : variant === "square"
                      ? "px-0.5"
                      : null,
            )}
        >
            <span
                aria-hidden="true"
                className={cn(
                    "relative grid shrink-0 place-items-center overflow-hidden rounded-full border-[3px] border-mint/60 bg-cream font-display font-extrabold text-ink uppercase transition-[border-color,outline-color] duration-150 motion-reduce:transition-none",
                    variant === "inline"
                        ? "size-9 [@media(max-height:560px)]:size-8"
                        : variant === "wide"
                          ? "size-10 sm:size-12 [@media(max-height:560px)]:size-8"
                          : "size-10 sm:size-14 [@media(max-height:560px)]:size-8",
                    active &&
                        "border-rust outline-[3px] outline-offset-2 outline-rust",
                    won &&
                        !active &&
                        "border-mint outline-[3px] outline-offset-2 outline-mint",
                )}
            >
                {avatarUrl ? (
                    <Image
                        src={avatarUrl}
                        alt=""
                        fill
                        unoptimized
                        sizes="56px"
                        className="object-cover"
                    />
                ) : (
                    <span>{name.charAt(0)}</span>
                )}
            </span>

            <span
                className={cn(
                    "max-w-full font-display font-extrabold tracking-[-.02em] text-cream",
                    variant === "inline"
                        ? "min-w-0 truncate text-[13px] [@media(max-height:560px)]:text-[11px]"
                        : variant === "wide"
                          ? "truncate text-[13px] sm:text-[15px] [@media(max-height:560px)]:text-[11px]"
                          : "line-clamp-2 break-words text-[9px] leading-tight sm:text-[12px] [@media(max-height:560px)]:text-[8px]",
                )}
            >
                {name}
                {youLabel ? (
                    <span className="text-mint/70"> · {youLabel}</span>
                ) : null}
            </span>

            {won ? (
                <span className="text-[8px] font-bold tracking-wide text-mint uppercase sm:text-[10px]">
                    {wonLabel}
                </span>
            ) : null}
        </div>
    );
}
