import Image from "next/image";

import { cn } from "@/lib/ui/cn";

// Round, at every size and on every screen that uses one — this component is
// app-only, and the app is the felt. A square avatar was the cream page's
// shape, matching the 4px frames around it; on the felt it is the one hard
// corner left, and it sits inside rounded blocks whose corners it cannot be
// made concentric with at any radius. `GameSeat` has drawn its faces round all
// along.
const sizes = {
    /** Bottom-bar scale: an avatar standing in for a nav glyph. */
    sm: { box: "size-6 border-2", text: "text-[11px]", px: 24 },
    /** Top-bar scale. */
    md: { box: "size-10 border-[3px]", text: "text-[17px]", px: 40 },
    /** Seat scale: the tile a player wears at the table. */
    lg: { box: "size-11 border-[3px]", text: "text-[19px]", px: 44 },
} as const;

type UserAvatarProps = {
    username: string;
    avatarUrl: string | null;
    size?: keyof typeof sizes;
    className?: string;
};

/** The real account image, with an initial for guests and image-less accounts. */
export default function UserAvatar({
    username,
    avatarUrl,
    size = "md",
    className,
}: UserAvatarProps) {
    const scale = sizes[size];

    if (avatarUrl) {
        return (
            <Image
                src={avatarUrl}
                alt=""
                width={scale.px}
                height={scale.px}
                unoptimized
                className={cn(
                    "shrink-0 rounded-full border-cream object-cover",
                    scale.box,
                    className,
                )}
            />
        );
    }

    return (
        <span
            aria-hidden="true"
            className={cn(
                "grid shrink-0 place-items-center rounded-full border-cream bg-rust font-display font-extrabold uppercase text-cream",
                scale.box,
                scale.text,
                className,
            )}
        >
            {username.charAt(0)}
        </span>
    );
}
