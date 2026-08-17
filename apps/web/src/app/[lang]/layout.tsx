import type { Metadata } from "next";
import {
  Bricolage_Grotesque,
  JetBrains_Mono,
  Public_Sans,
} from "next/font/google";

import { localePage } from "@/dictionaries";
import { locales } from "@/lib/i18n";
import "../globals.css";

const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
});

const publicSans = Public_Sans({
  variable: "--font-public-sans",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
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
  const { lang, dict } = await localePage(params);

  return {
    metadataBase: new URL("https://belote.gg"),
    // Only the landing page names itself in full; every other screen supplies
    // its own short title and gets the brand appended.
    title: { default: dict.meta.title, template: "%s — belote.gg" },
    description: dict.meta.description,
    alternates: {
      canonical: `/${lang}`,
      // Every language points at every other one, itself included — a crawler
      // that lands on either URL learns about both without following the
      // detection redirect on `/`.
      languages: {
        en: "/en",
        hr: "/hr",
        "x-default": "/en",
      },
    },
  };
}

export default async function RootLayout({
  children,
  params,
}: LayoutProps<"/[lang]">) {
  const { lang } = await localePage(params);

  return (
    <html
      lang={lang}
      className={`${bricolage.variable} ${publicSans.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-cream font-sans text-ink selection:bg-rust selection:text-cream">
        {children}
      </body>
    </html>
  );
}
