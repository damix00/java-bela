import HomeHero from "@/components/pages/home/hero/hero";
import HomeSection2 from "@/components/pages/home/section2";
import HomeSection3 from "@/components/pages/home/section3";
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
            <HomeSection3 />
        </div>
    );
}
