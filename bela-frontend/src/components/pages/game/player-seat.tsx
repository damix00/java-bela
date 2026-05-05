"use client";

import { motion } from "motion/react";
import { GamePlayer } from "@/types/game";
import { useEffect, useState } from "react";
import { getUserData, PublicUserData } from "@/lib/user-cache";

type Position = "top" | "left" | "right" | "bottom";

export default function PlayerSeat({
    player,
    position,
    isCurrentTurn,
}: {
    player: GamePlayer;
    position: Position;
    isCurrentTurn: boolean;
}) {
    const [userData, setUserData] = useState<PublicUserData | null>(null);
    const botUserData: PublicUserData | null = player.bot
        ? {
              id: player.userId,
              username: `Bot ${player.seatIndex + 1}`,
              avatarUrl: null,
              createdAt: new Date().toISOString(),
          }
        : null;

    useEffect(() => {
        if (player.bot) {
            return;
        }
        let ignore = false;

        getUserData(player.userId).then((data) => {
            if (!ignore) {
                setUserData(data);
            }
        });

        return () => {
            ignore = true;
        };
    }, [player.bot, player.userId]);

    const displayUserData = botUserData ?? userData;
    const displayName = displayUserData?.username ?? "...";
    const initials = displayName.slice(0, 2).toUpperCase();

    // Card count indicator for opponents
    const cardCount = player.hand?.length ?? 0;

    return (
        <motion.div
            className="flex min-h-[4.75rem] max-w-[5.75rem] flex-col items-center gap-1 md:min-h-[6.25rem] md:max-w-none md:gap-1.5"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{
                type: "spring",
                stiffness: 200,
                damping: 20,
                delay: 0.1,
            }}>
            {/* Avatar */}
            <div className="relative">
                <div
                    className={`flex h-10 w-10 items-center justify-center rounded-lg text-xs font-bold md:h-14 md:w-14 md:text-sm ${
                        isCurrentTurn
                            ? "bg-primary text-on-primary ring-2 ring-primary ring-offset-2 ring-offset-background"
                            : "bg-background-tertiary text-foreground-muted"
                    }`}>
                    {displayUserData?.avatarUrl ? (
                        <img
                            src={displayUserData.avatarUrl}
                            alt={displayName}
                            className="w-full h-full rounded-lg object-cover"
                        />
                    ) : (
                        initials
                    )}
                </div>

                {/* Card count badge */}
                {position !== "bottom" && cardCount > 0 && (
                    <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full border border-background-tertiary bg-background-secondary text-[9px] font-bold text-foreground-muted md:h-5 md:w-5 md:text-[10px]">
                        {cardCount}
                    </span>
                )}
            </div>

            {/* Name plate */}
            <div
                className={`max-w-full truncate rounded px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide md:px-3 md:py-1 md:text-xs md:tracking-wider ${
                    isCurrentTurn
                        ? "bg-background-tertiary text-primary"
                        : "bg-background-tertiary/60 text-foreground-muted"
                }`}>
                {displayName}
            </div>

            {/* Turn indicator */}
            <motion.div
                className="h-3 text-[9px] font-bold uppercase leading-3 tracking-wide text-primary md:text-[10px] md:tracking-widest"
                initial={{ opacity: 0 }}
                animate={isCurrentTurn ? { opacity: [1, 0.35, 1] } : { opacity: 0 }}
                transition={{
                    repeat: isCurrentTurn ? Infinity : 0,
                    duration: 0.8,
                }}>
                {position === "bottom" ? "Your Turn" : "Playing..."}
            </motion.div>
        </motion.div>
    );
}
