import type { Metadata } from "next";

import ChooseUsernameScreen from "@/components/pages/auth/sections/ChooseUsernameScreen";
import { localePage } from "@/dictionaries";

export async function generateMetadata({
  params,
}: PageProps<"/[lang]/username">): Promise<Metadata> {
  const { dict } = await localePage(params);

  return { title: dict.auth.username.title };
}

export default async function Page({ params }: PageProps<"/[lang]/username">) {
  const { dict } = await localePage(params);

  return (
    <ChooseUsernameScreen
      copy={dict.auth.username}
      common={dict.auth.common}
    />
  );
}
