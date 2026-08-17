import type { Metadata } from "next";

import CheckEmailScreen from "@/components/pages/auth/sections/CheckEmailScreen";
import { localePage } from "@/dictionaries";

export async function generateMetadata({
  params,
}: PageProps<"/[lang]/check-email">): Promise<Metadata> {
  const { dict } = await localePage(params);

  return { title: dict.auth.checkEmail.title };
}

export default async function Page({ params }: PageProps<"/[lang]/check-email">) {
  const { dict } = await localePage(params);

  return (
    <CheckEmailScreen
      copy={dict.auth.checkEmail}
    />
  );
}
