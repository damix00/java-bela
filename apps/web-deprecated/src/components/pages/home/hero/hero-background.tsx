import HeroPlayingCard from "./hero-playing-card";

export default function HeroBackground() {
    return (
        <div className="absolute top-0 left-0 w-full h-full select-none overflow-hidden sm:overflow-visible">
            <div className="bg-linear-to-br w-full h-full from-primary/5 to-transparent -z-50"></div>
            <div className="absolute inset-0 opacity-20 overflow-hidden">
                <div className="absolute top-28 right-12 lg:top-28 lg:right-16 xl:top-32 xl:right-24 rotate-12">
                    <HeroPlayingCard value="A" suit="♠" />
                </div>
                <div className="absolute bottom-10 left-12 lg:bottom-14 lg:left-14 xl:bottom-16 xl:left-20 -rotate-12">
                    <HeroPlayingCard value="K" suit="♣" />
                </div>
            </div>
        </div>
    );
}
