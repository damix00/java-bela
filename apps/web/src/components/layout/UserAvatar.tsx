import Image from "next/image";

import type { User } from "@/api/types/user";
import { cn } from "@/lib/cn";

const sizes = {
    /** Bottom-bar scale: an avatar standing in for a nav glyph. */
    sm: { box: "size-6 border-2", text: "text-[11px]", px: 24 },
    /** Top-bar scale. */
    md: { box: "size-10 border-[3px]", text: "text-[17px]", px: 40 },
} as const;

type UserAvatarProps = {
    user: User;
    size?: keyof typeof sizes;
    className?: string;
};

/** The real account image, with an initial for guests and image-less accounts. */
export default function UserAvatar({
    user,
    size = "md",
    className,
}: UserAvatarProps) {
    const scale = sizes[size];

    if (user.avatarUrl) {
        return (
            <Image
                src={user.avatarUrl}
                alt=""
                width={scale.px}
                height={scale.px}
                unoptimized
                className={cn(
                    "shrink-0 border-cream object-cover",
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
                "grid shrink-0 place-items-center border-cream bg-rust font-display font-extrabold uppercase text-cream",
                scale.box,
                scale.text,
                className,
            )}
        >
            {user.username.charAt(0)}
        </span>
    );
}
