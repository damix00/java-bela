export default function HeroPlayingCard({
    value,
    suit,
}: {
    value: string;
    suit: string;
}) {
    const isRedSuit = suit === "♥" || suit === "♦";

    return (
        <div className="relative w-32 h-48 sm:w-40 sm:h-56 lg:w-48 lg:h-68 xl:w-56 xl:h-80 rounded-xl bg-[#4C4C4C] overflow-hidden">
            <div
                className={`absolute top-3 left-3 sm:top-4 sm:left-4 text-xs sm:text-sm lg:text-base leading-none font-bold ${
                    isRedSuit ? "text-red-600" : "text-foreground"
                }`}>
                <div>{value}</div>
                <div>{suit}</div>
            </div>

            <div
                className={`absolute bottom-3 right-3 sm:bottom-4 sm:right-4 rotate-180 text-xs sm:text-sm lg:text-base leading-none font-bold ${
                    isRedSuit ? "text-red-600" : "text-foreground"
                }`}>
                <div>{value}</div>
                <div>{suit}</div>
            </div>

            <div className="h-full w-full flex items-center justify-center">
                <span
                    className={`text-[3rem] sm:text-[4rem] lg:text-[4.8rem] xl:text-[5.6rem] font-black tracking-tight ${
                        isRedSuit ? "text-red-600" : "text-foreground"
                    }`}>
                    {suit}
                </span>
            </div>
        </div>
    );
}
