import SignUpScreen from "@/components/pages/auth/sections/SignUpScreen";
import Modal from "@/components/ui/surfaces/Modal";
import { localePage } from "@/dictionaries";

/** The sign-up half of the pair — see `(.)sign-in/page.tsx`. */
export default async function Page({ params }: PageProps<"/[lang]/sign-up">) {
  const { lang, dict } = await localePage(params);

  return (
    <Modal closeLabel={dict.auth.common.back} dismissible={false}>
      <SignUpScreen
        copy={dict.auth.signUp}
        common={dict.auth.common}
        form={dict.form}
        locale={lang}
      />
    </Modal>
  );
}
