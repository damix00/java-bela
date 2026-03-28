import type { Metadata } from "next";
import { DM_Sans, Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/auth-context";
import { getCurrentUser, refreshToken } from "@/actions/auth";
import { Toaster } from "sonner";

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
    weight: [
        "100",
        "200",
        "300",
        "400",
        "500",
        "600",
        "700",
        "800",
        "900",
        "1000",
    ],
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
                <Toaster
                    theme="dark"
                    toastOptions={{
                        classNames: {
                            title: "select-none",
                            description: "select-none",
                        },
                        style: {
                            userSelect: "none",
                            fontFamily: "var(--font-body)",
                            backgroundColor: "var(--background-secondary)",
                        },
                    }}
                />
                <AuthProvider
                    initialUser={authData?.user ?? null}
                    initialToken={authData?.jwt ?? ""}>
                    {children}
                </AuthProvider>
            </body>
        </html>
    );
}
