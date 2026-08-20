import type { Metadata } from "next";
import { Bricolage_Grotesque, Public_Sans } from "next/font/google";

import { localePage } from "@/dictionaries";
import { locales } from "@/lib/i18n";
import "../globals.css";
import Script from "next/script";

const bricolage = Bricolage_Grotesque({
    variable: "--font-bricolage",
    subsets: ["latin"],
});

const publicSans = Public_Sans({
    variable: "--font-public-sans",
    subsets: ["latin"],
});

export function generateStaticParams() {
    return locales.map((lang) => ({ lang }));
}

/** A prefix we don't speak is a 404, not an English page under a fake locale. */
export const dynamicParams = false;

export async function generateMetadata({
    params,
}: LayoutProps<"/[lang]">): Promise<Metadata> {
    const { dict } = await localePage(params);

    return {
        metadataBase: new URL("https://belote.gg"),
        // Only the landing page names itself in full; every other screen supplies
        // its own short title and gets the brand appended.
        title: { default: dict.meta.title, template: "%s — belote.gg" },
        description: dict.meta.description,
        // The canonical URL and the language alternates are declared by
        // `landing/page.tsx`, not here: this layout also wraps the lobby, which is
        // a personal page and deliberately not indexed.
    };
}

export default async function RootLayout({
    children,
    modal,
    params,
}: LayoutProps<"/[lang]">) {
    const { lang } = await localePage(params);

    // Deliberately reads no cookies: this layout wraps the landing page and the
    // legal documents, which must stay statically rendered. The session is read
    // one level down, in `(app)/layout.tsx`.
    return (
        <html
            lang={lang}
            className={`${bricolage.variable} ${publicSans.variable} h-full antialiased`}>
            <head>
                <Script
                    src="//unpkg.com/react-scan/dist/auto.global.js"
                    crossOrigin="anonymous"
                    strategy="beforeInteractive"
                />
            </head>
            <body className="flex min-h-full flex-col bg-cream has-[[data-felt]]:bg-baize font-sans text-ink selection:bg-rust selection:text-cream">
                {children}
                {/* The intercepted auth routes render here, over `children`. The slot
            sits at this level so a click from anywhere under `/[lang]` — the
            lobby, but the landing page too — opens the form as a modal. */}
                {modal}
            </body>
        </html>
    );
}
