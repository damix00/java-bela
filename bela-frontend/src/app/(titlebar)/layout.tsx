import Titlebar from "@/components/nav/titlebar";
import Footer from "@/components/nav/footer";

export default function TitlebarLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <div className="min-h-screen flex flex-col">
            <nav>
                <Titlebar />
            </nav>
            <main className="flex-1">{children}</main>
            <Footer />
        </div>
    );
}
