import type { Metadata } from "next";
import { DM_Sans, Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
    subsets: ["latin"],
    variable: "--font-heading-cn",
    weight: "900",
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

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html
            lang="en"
            className={`${dmSans.variable} ${inter.variable} antialiased h-full`}>
            <body className="flex flex-col">{children}</body>
        </html>
    );
}
