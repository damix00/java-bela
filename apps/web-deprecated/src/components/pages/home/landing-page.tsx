import Footer from "@/components/nav/footer";
import Titlebar from "@/components/nav/titlebar";
import HomeHero from "@/components/pages/home/hero/hero";
import HomeSection2 from "@/components/pages/home/section2";
import HomeSection3 from "@/components/pages/home/section3";

export default function LandingPage() {
    return (
        <div className="min-h-screen flex flex-col">
            <nav>
                <Titlebar />
            </nav>
            <main className="flex-1">
                <HomeHero />
                <HomeSection2 />
                <HomeSection3 />
            </main>
            <Footer />
        </div>
    );
}
