import Image from "next/image";

import { cn } from "@/lib/ui/cn";

type GameSeatProps = {
    playerIndex: number;
    name: string;
    avatarUrl: string | null;
    /** Theirs to act — the only state on this screen that has to be unmissable. */
    active: boolean;
    /** They took the trick now sitting on the table. */
    won: boolean;
    /** Wide sits across, square on the sides. */
    variant: "wide" | "square";
    wonLabel: string;
};

/**
 * A player reduced to the two things needed during play: face and name.
 *
 * Only the other three are drawn. Your own chair used to sit under the hand
 * with a "· you" after it, which told you something you already knew and took a
 * row the cards wanted.
 */
export default function GameSeat({
    playerIndex,
    name,
    avatarUrl,
    active,
    won,
    variant,
    wonLabel,
}: GameSeatProps) {
    return (
        <div
            data-game-seat=""
            aria-label={won ? `${name} · ${wonLabel}` : name}
            className={cn(
                "flex h-full w-full min-w-0 flex-col items-center justify-center gap-1 text-center",
                variant === "wide" ? "py-0.5" : "px-0.5",
            )}
        >
            <span
                data-card-origin={playerIndex}
                aria-hidden="true"
                // One ring, not a border plus an outline: the two used to draw
                // concentric circles around the avatar whenever a seat was
                // active, which read as a target rather than as a face.
                className={cn(
                    "relative grid shrink-0 place-items-center overflow-hidden rounded-full bg-cream font-display font-extrabold text-ink uppercase ring-2 ring-mint/25 transition-[box-shadow] duration-150 motion-reduce:transition-none",
                    variant === "wide"
                        ? "size-10 sm:size-12 [@media(max-height:560px)]:size-8"
                        : "size-10 sm:size-14 [@media(max-height:560px)]:size-8",
                    active && "ring-[3px] ring-rust",
                    won && !active && "ring-[3px] ring-mint",
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
                    variant === "wide"
                        ? "truncate text-[13px] sm:text-[15px] [@media(max-height:560px)]:text-[11px]"
                        : "line-clamp-2 break-words text-[9px] leading-tight sm:text-[12px] [@media(max-height:560px)]:text-[8px]",
                )}
            >
                {name}
            </span>

            {won ? (
                <span className="text-[8px] font-bold tracking-wide text-mint uppercase sm:text-[10px]">
                    {wonLabel}
                </span>
            ) : null}
        </div>
    );
}
