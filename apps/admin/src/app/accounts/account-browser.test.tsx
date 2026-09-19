import type {
    AdminAccountPageResponse,
    AdminAccountSummaryResponse,
    AuthProvider,
    PresenceStatus,
    Role,
} from "@bela/protocol";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AccountBrowser } from "@/app/accounts/account-browser";

const push = vi.fn();

vi.mock("next/navigation", () => ({
    useRouter: () => ({ push }),
}));

vi.mock("next/link", () => ({
    default: ({ href, children, ...properties }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
        <a href={String(href)} {...properties}>{children}</a>
    ),
}));

function account(id: string, username: string): AdminAccountSummaryResponse {
    return {
        id,
        username,
        email: `${username.toLowerCase()}@example.com`,
        authProvider: "LOCAL" as AuthProvider,
        role: "USER" as Role,
        createdAt: new Date("2026-09-17T12:00:00Z"),
        lastLoginAt: new Date("2026-09-17T12:00:00Z"),
        active: false,
        sessionCount: 0,
        presenceStatus: "OFFLINE" as PresenceStatus,
    };
}

describe("AccountBrowser", () => {
    beforeEach(() => {
        push.mockReset();
        vi.unstubAllGlobals();
    });

    it("renders the first batch and lazily appends the next batch", async () => {
        const initialPage: AdminAccountPageResponse = {
            accounts: [account("1", "First")],
            nextCursor: "next-page",
        };
        vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
            ok: true,
            json: async () => ({ accounts: [account("2", "Second")], nextCursor: null }),
        }));
        render(<AccountBrowser initialPage={initialPage} initialFilters={{ activity: "ACTIVE" }} />);

        expect(screen.getByText("First")).toBeTruthy();
        await userEvent.click(screen.getByRole("button", { name: "Load 25 more" }));

        await waitFor(() => expect(screen.getByText("Second")).toBeTruthy());
        expect(fetch).toHaveBeenCalledWith("/api/accounts?activity=ACTIVE&cursor=next-page");
        expect(screen.queryByRole("button", { name: "Load 25 more" })).toBeNull();
    });

    it("surfaces load failures and lets the administrator retry", async () => {
        const initialPage: AdminAccountPageResponse = {
            accounts: [account("1", "First")],
            nextCursor: "next-page",
        };
        const fetchMock = vi.fn()
            .mockRejectedValueOnce(new Error("Network unavailable"))
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({ accounts: [account("2", "Recovered")], nextCursor: null }),
            });
        vi.stubGlobal("fetch", fetchMock);
        render(<AccountBrowser initialPage={initialPage} initialFilters={{}} />);

        await userEvent.click(screen.getByRole("button", { name: "Load 25 more" }));
        expect(await screen.findByText("Network unavailable")).toBeTruthy();
        await userEvent.click(screen.getByRole("button", { name: "Load 25 more" }));
        expect(await screen.findByText("Recovered")).toBeTruthy();
    });

    it("navigates with fresh filters and never carries the lazy cursor", () => {
        render(
            <AccountBrowser
                initialPage={{ accounts: [], nextCursor: "stale-cursor" }}
                initialFilters={{ activity: "ACTIVE" }}
            />,
        );
        fireEvent.change(screen.getByLabelText("Search"), { target: { value: "alice" } });
        fireEvent.change(screen.getByLabelText("Activity"), { target: { value: "INACTIVE" } });
        fireEvent.submit(screen.getByRole("button", { name: "Apply filters" }).closest("form")!);

        expect(push).toHaveBeenCalledWith("/accounts?query=alice&activity=INACTIVE");
        expect(push.mock.calls[0][0]).not.toContain("cursor");
    });
});
