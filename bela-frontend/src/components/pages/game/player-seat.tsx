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
            className="flex min-h-[6.25rem] flex-col items-center gap-1.5"
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
                    className={`w-12 h-12 md:w-14 md:h-14 rounded-lg flex items-center justify-center text-sm font-bold ${
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
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-background-secondary border border-background-tertiary rounded-full flex items-center justify-center text-[10px] font-bold text-foreground-muted">
                        {cardCount}
                    </span>
                )}
            </div>

            {/* Name plate */}
            <div
                className={`px-3 py-1 rounded text-xs font-semibold uppercase tracking-wider ${
                    isCurrentTurn
                        ? "bg-background-tertiary text-primary"
                        : "bg-background-tertiary/60 text-foreground-muted"
                }`}>
                {displayName}
            </div>

            {/* Turn indicator */}
            <motion.div
                className="h-3 text-[10px] font-bold uppercase leading-3 tracking-widest text-primary"
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
