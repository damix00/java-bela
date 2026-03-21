import HomeHero from "@/components/pages/home/hero/hero";
import HomeSection2 from "@/components/pages/home/section2";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Belote.gg - Play Belote Online",
    description: "Traditional card game, reimagined.",
};

export default function Home() {
    return (
        <div className="">
            <HomeHero />
            <HomeSection2 />
        </div>
    );
}
