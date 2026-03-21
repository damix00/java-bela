import Titlebar from "@/components/nav/titlebar";

export default function TitlebarLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <>
            <nav>
                <Titlebar />
            </nav>
            <main>{children}</main>
        </>
    );
}
