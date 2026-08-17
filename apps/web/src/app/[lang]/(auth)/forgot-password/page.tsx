import type { Metadata } from "next";

import ForgotPasswordScreen from "@/components/pages/auth/sections/ForgotPasswordScreen";
import { localePage } from "@/dictionaries";

export async function generateMetadata({
  params,
}: PageProps<"/[lang]/forgot-password">): Promise<Metadata> {
  const { dict } = await localePage(params);

  return { title: dict.auth.forgot.title };
}

export default async function Page({ params }: PageProps<"/[lang]/forgot-password">) {
  const { lang, dict } = await localePage(params);

  return (
    <ForgotPasswordScreen
      copy={dict.auth.forgot}
      common={dict.auth.common}
      form={dict.form}
      locale={lang}
    />
  );
}
