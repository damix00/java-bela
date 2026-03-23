import type { Metadata } from "next";
import { DM_Sans, Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/auth-context";
import { getCurrentUser } from "@/actions/auth";

const inter = Inter({
    subsets: ["latin"],
    variable: "--font-heading-cn",
    weight: ["400", "500", "600", "700", "800", "900"],
    display: "swap",
});

const dmSans = DM_Sans({
    subsets: ["latin"],
    variable: "--font-body-cn",
    display: "swap",
});

export const metadata: Metadata = {
    title: "Belote.gg",
};

export default async function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    const authData = await getCurrentUser();

    return (
        <html
            lang="en"
            className={`${dmSans.variable} ${inter.variable} antialiased h-full`}>
            <body className="flex flex-col">
                <AuthProvider initialUser={authData?.user ?? null}>
                    {children}
                </AuthProvider>
            </body>
        </html>
    );
}
