import type { Metadata } from "next";

import ResetPasswordScreen from "@/components/pages/auth/sections/ResetPasswordScreen";
import { localePage } from "@/dictionaries";

export async function generateMetadata({
  params,
}: PageProps<"/[lang]/reset-password">): Promise<Metadata> {
  const { dict } = await localePage(params);

  return { title: dict.auth.reset.title };
}

export default async function Page({ params }: PageProps<"/[lang]/reset-password">) {
  const { dict } = await localePage(params);

  return (
    <ResetPasswordScreen
      copy={dict.auth.reset}
      common={dict.auth.common}
    />
  );
}
