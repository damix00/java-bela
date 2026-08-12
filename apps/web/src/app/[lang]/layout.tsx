import type { Metadata } from "next";
import {
  Bricolage_Grotesque,
  JetBrains_Mono,
  Public_Sans,
} from "next/font/google";
import { notFound } from "next/navigation";

import { getDictionary } from "@/dictionaries";
import { isLocale, locales } from "@/lib/i18n";
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
  const { lang } = await params;

  if (!isLocale(lang)) notFound();

  const dict = await getDictionary(lang);

  return {
    metadataBase: new URL("https://belote.gg"),
    title: dict.meta.title,
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
  const { lang } = await params;

  if (!isLocale(lang)) notFound();

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
