"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { logout } from "@/actions/auth";
import { clearAuth } from "@/api/token-store";
import { Button } from "@/components/controls/Button";

type SignOutButtonProps = {
  label: string;
  className?: string;
};

export default function SignOutButton({ label, className }: SignOutButtonProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <Button
      tone="cream"
      size="sm"
      disabled={pending}
      className={className}
      onClick={() =>
        startTransition(async () => {
          await logout();
          // The action cleared the cookies and revoked the refresh family
          // server-side; this drops the access token the client still holds,
          // so `apiFetch` stops sending a token that is no longer ours.
          clearAuth();
          // `refresh` is what makes the server components re-render and the
          // lobby fall back to its signed-out half.
          router.refresh();
        })
      }
    >
      {label}
    </Button>
  );
}
