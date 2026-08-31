"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { logout } from "@/actions/auth";
import { clearAuth } from "@/api/token-store";
import { Button } from "@/components/controls/Button";
import { forgetLobby } from "@/lib/game/last-lobby";

type SignOutButtonProps = {
    label: string;
    className?: string;
};

export default function SignOutButton({
    label,
    className,
}: SignOutButtonProps) {
    const router = useRouter();
    const [pending, startTransition] = useTransition();

    return (
        <Button
            surface="felt"
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
                    // The remembered table belongs to the account that was
                    // sitting at it. Left behind, the next person to sign in on
                    // this tab would be rejoined to a stranger's lobby — see
                    // `last-lobby`.
                    forgetLobby();
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
