import CheckEmailScreen from "@/components/pages/auth/sections/CheckEmailScreen";
import { localePage } from "@/dictionaries";
import { localeMetadata } from "@/lib/metadata";

export const generateMetadata = localeMetadata(
  (dict) => dict.auth.checkEmail.title,
);

export default async function Page({
  params,
}: PageProps<"/[lang]/check-email">) {
  const { dict } = await localePage(params);

  return <CheckEmailScreen copy={dict.auth.checkEmail} />;
}
