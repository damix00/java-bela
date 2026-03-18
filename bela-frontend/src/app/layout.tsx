import type { Metadata } from "next";
import { Cinzel, DM_Sans } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "../context/theme-provider";
import { AuthProvider } from "../context/auth-context";
import { getAuthCookie } from "@/actions/auth";

const displayFont = Cinzel({
    variable: "--font-cinzel",
    subsets: ["latin"],
    weight: ["400", "700", "900"],
});

const bodyFont = DM_Sans({
    variable: "--font-body",
    subsets: ["latin"],
});

export const metadata: Metadata = {
    title: "Belote",
    description:
        "A classic 4-player card game of European origin, played with a 32-card deck.",
};

export default async function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    const user = await getAuthCookie();

    return (
        <html lang="en" suppressHydrationWarning>
            <body
                className={`${displayFont.variable} ${bodyFont.variable} antialiased`}>
                <ThemeProvider
                    attribute="class"
                    defaultTheme="system"
                    enableSystem
                    disableTransitionOnChange>
                    <AuthProvider initialUser={user}>
                        {children}
                    </AuthProvider>
                </ThemeProvider>
            </body>
        </html>
    );
}
