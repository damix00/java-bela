import type { Metadata } from "next";

import SignUpScreen from "@/components/pages/auth/sections/SignUpScreen";
import { localePage } from "@/dictionaries";

export async function generateMetadata({
  params,
}: PageProps<"/[lang]/sign-up">): Promise<Metadata> {
  const { dict } = await localePage(params);

  return { title: dict.auth.signUp.title };
}

export default async function Page({ params }: PageProps<"/[lang]/sign-up">) {
  const { lang, dict } = await localePage(params);

  return (
    <SignUpScreen
      copy={dict.auth.signUp}
      common={dict.auth.common}
      form={dict.form}
      locale={lang}
    />
  );
}
