import type {
    AdminAccountDetailResponse,
    AuthProvider,
    PresenceStatus,
    Role,
} from "@bela/protocol";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { AccountActions } from "@/app/accounts/account-actions";

vi.mock("@/actions/accounts", () => ({
    initialAccountActionState: { status: "idle", message: "" },
    forceSignOutAction: vi.fn(),
    changeRoleAction: vi.fn(),
    deleteAccountAction: vi.fn(),
}));

function detail(canChangeRole = true, canDelete = true): AdminAccountDetailResponse {
    return {
        id: "user-1",
        username: "Alice",
        email: "alice@example.com",
        bio: "",
        avatarUrl: "",
        countryCode: "",
        authProvider: "LOCAL" as AuthProvider,
        role: "USER" as Role,
        createdAt: new Date("2026-09-17T12:00:00Z"),
        updatedAt: new Date("2026-09-17T12:00:00Z"),
        lastLoginAt: new Date("2026-09-17T12:00:00Z"),
        presence: {
            status: "OFFLINE" as PresenceStatus,
            lastPing: new Date("2026-09-17T12:00:00Z"),
            lobbyId: "",
            gameId: "",
        },
        sessions: [],
        actions: {
            canForceSignOut: true,
            canChangeRole,
            canDelete,
            roleChangeBlockedReason: canChangeRole ? "" : "Role change blocked",
            deletionBlockedReason: canDelete ? "" : "Deletion blocked",
        },
    };
}

describe("AccountActions", () => {
    it("requires exact username confirmation fields for role changes and deletion", () => {
        render(<AccountActions account={detail()} />);

        const roleConfirmation = screen.getByLabelText("Username confirmation for role change");
        const deleteConfirmation = screen.getByLabelText("Username confirmation for account deletion");
        expect(roleConfirmation.getAttribute("required")).not.toBeNull();
        expect(deleteConfirmation.getAttribute("required")).not.toBeNull();
        expect(roleConfirmation.getAttribute("placeholder")).toBe("Alice");
        expect(deleteConfirmation.getAttribute("placeholder")).toBe("Alice");
    });

    it("disables destructive controls and explains server-provided safeguards", () => {
        render(<AccountActions account={detail(false, false)} />);

        expect((screen.getByRole("button", { name: "Change to ADMIN" }) as HTMLButtonElement).disabled).toBe(true);
        expect((screen.getByRole("button", { name: "Delete account" }) as HTMLButtonElement).disabled).toBe(true);
        expect(screen.getByText("Role change blocked")).toBeTruthy();
        expect(screen.getByText("Deletion blocked")).toBeTruthy();
    });
});
