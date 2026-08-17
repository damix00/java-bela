import type { Metadata } from "next";

import TwoFactorScreen from "@/components/pages/auth/sections/TwoFactorScreen";
import { localePage } from "@/dictionaries";

export async function generateMetadata({
  params,
}: PageProps<"/[lang]/two-factor">): Promise<Metadata> {
  const { dict } = await localePage(params);

  return { title: dict.auth.twoFactor.title };
}

export default async function Page({ params }: PageProps<"/[lang]/two-factor">) {
  const { lang, dict } = await localePage(params);

  return (
    <TwoFactorScreen
      copy={dict.auth.twoFactor}
      common={dict.auth.common}
      locale={lang}
    />
  );
}
