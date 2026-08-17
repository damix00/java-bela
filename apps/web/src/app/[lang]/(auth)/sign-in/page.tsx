import type { Metadata } from "next";

import SignInScreen from "@/components/pages/auth/sections/SignInScreen";
import { localePage } from "@/dictionaries";

export async function generateMetadata({
  params,
}: PageProps<"/[lang]/sign-in">): Promise<Metadata> {
  const { dict } = await localePage(params);

  return { title: dict.auth.signIn.title };
}

export default async function Page({ params }: PageProps<"/[lang]/sign-in">) {
  const { lang, dict } = await localePage(params);

  return (
    <SignInScreen
      copy={dict.auth.signIn}
      common={dict.auth.common}
      locale={lang}
    />
  );
}
