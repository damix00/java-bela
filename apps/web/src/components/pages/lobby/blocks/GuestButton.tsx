"use client";

import { loginAnonymous } from "@/actions/auth";
import { Button } from "@/components/controls/Button";
import FormError from "@/components/controls/FormError";
import { useAuthSubmit } from "@/components/pages/auth/useAuthSubmit";
import type { Dictionary } from "@/dictionaries";
import type { Locale } from "@/lib/i18n";

type GuestButtonProps = {
  label: string;
  errors: Dictionary["form"]["errors"];
  locale: Locale;
};

/**
 * The shortest path to a first game: one click, an account created on the fly,
 * straight into the lobby. Nothing is asked for, which is the whole point —
 * every field between here and a table is somewhere to lose someone.
 */
export default function GuestButton({
  label,
  errors,
  locale,
}: GuestButtonProps) {
  const { submit, pending, error } = useAuthSubmit(locale, errors);

  return (
    <div className="flex flex-col gap-3">
      {error && <FormError>{error}</FormError>}
      <Button
        tone="cream"
        size="md"
        disabled={pending}
        onClick={() => submit(loginAnonymous, errors.signInFailed)}
        className="disabled:cursor-wait disabled:opacity-70"
      >
        {label}
      </Button>
    </div>
  );
}
