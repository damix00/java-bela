import type { Metadata } from "next";

import WelcomeScreen from "@/components/pages/auth/sections/WelcomeScreen";
import { localePage } from "@/dictionaries";

export async function generateMetadata({
  params,
}: PageProps<"/[lang]/welcome">): Promise<Metadata> {
  const { dict } = await localePage(params);

  return { title: dict.auth.welcome.title };
}

export default async function Page({ params }: PageProps<"/[lang]/welcome">) {
  const { dict } = await localePage(params);

  return (
    <WelcomeScreen
      copy={dict.auth.welcome}
    />
  );
}
