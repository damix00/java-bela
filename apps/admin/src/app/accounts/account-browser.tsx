"use client";

import type {
    AdminAccountPageResponse,
    AdminAccountSummaryResponse,
} from "@bela/protocol";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState, useTransition } from "react";

import type { AccountFilters } from "@/lib/api/accounts";

function queryString(filters: AccountFilters, cursor?: string) {
    const parameters = new URLSearchParams();
    for (const [key, value] of Object.entries({ ...filters, cursor })) {
        if (value && value !== "ALL") {
            parameters.set(key, value);
        }
    }
    return parameters.toString();
}

function statusLabel(account: AdminAccountSummaryResponse) {
    if (!account.active) {
        return "Offline";
    }
    return account.presenceStatus.replaceAll("_", " ").toLowerCase();
}

export function AccountBrowser({
    initialPage,
    initialFilters,
}: {
    initialPage: AdminAccountPageResponse;
    initialFilters: AccountFilters;
}) {
    const router = useRouter();
    const [accounts, setAccounts] = useState(initialPage.accounts);
    const [cursor, setCursor] = useState(initialPage.nextCursor);
    const [error, setError] = useState("");
    const [loadingMore, setLoadingMore] = useState(false);
    const [filterPending, startFilterTransition] = useTransition();

    function applyFilters(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        const filters: AccountFilters = {
            query: String(formData.get("query") ?? "").trim(),
            accountType: String(formData.get("accountType") ?? "ALL"),
            activity: String(formData.get("activity") ?? "ALL"),
            role: String(formData.get("role") ?? "ALL"),
        };
        startFilterTransition(() => {
            const query = queryString(filters);
            router.push(query ? `/accounts?${query}` : "/accounts");
        });
    }

    async function loadMore() {
        if (!cursor || loadingMore) {
            return;
        }
        setLoadingMore(true);
        setError("");
        try {
            const query = queryString(initialFilters, cursor);
            const response = await fetch(`/api/accounts?${query}`);
            const body = await response.json() as AdminAccountPageResponse & { message?: string };
            if (!response.ok) {
                throw new Error(body.message ?? "Could not load more accounts");
            }
            setAccounts((current) => [...current, ...body.accounts]);
            setCursor(body.nextCursor);
        } catch (loadError) {
            setError(loadError instanceof Error ? loadError.message : "Could not load more accounts");
        } finally {
            setLoadingMore(false);
        }
    }

    return (
        <>
            <nav className="tabs" aria-label="Account views">
                <Link className={!initialFilters.accountType && !initialFilters.activity ? "tab tab--active" : "tab"} href="/accounts">
                    All
                </Link>
                <Link className={initialFilters.activity === "ACTIVE" ? "tab tab--active" : "tab"} href="/accounts?activity=ACTIVE">
                    Active
                </Link>
                <Link className={initialFilters.accountType === "GUEST" ? "tab tab--active" : "tab"} href="/accounts?accountType=GUEST">
                    Guests
                </Link>
            </nav>

            <form className="filters" onSubmit={applyFilters}>
                <label className="field field--wide">
                    <span>Search</span>
                    <input name="query" defaultValue={initialFilters.query} placeholder="Username, email, or account ID" />
                </label>
                <label className="field">
                    <span>Account type</span>
                    <select name="accountType" defaultValue={initialFilters.accountType ?? "ALL"}>
                        <option value="ALL">All</option>
                        <option value="REGISTERED">Registered</option>
                        <option value="GUEST">Guest</option>
                    </select>
                </label>
                <label className="field">
                    <span>Activity</span>
                    <select name="activity" defaultValue={initialFilters.activity ?? "ALL"}>
                        <option value="ALL">All</option>
                        <option value="ACTIVE">Active</option>
                        <option value="INACTIVE">Inactive</option>
                    </select>
                </label>
                <label className="field">
                    <span>Role</span>
                    <select name="role" defaultValue={initialFilters.role ?? "ALL"}>
                        <option value="ALL">All</option>
                        <option value="USER">User</option>
                        <option value="ADMIN">Admin</option>
                    </select>
                </label>
                <button className="button" disabled={filterPending}>
                    {filterPending ? "Applying…" : "Apply filters"}
                </button>
            </form>

            <div className="table-wrap">
                <table className="account-table">
                    <thead>
                        <tr>
                            <th>Account</th>
                            <th>Type</th>
                            <th>Role</th>
                            <th>Status</th>
                            <th>Created</th>
                        </tr>
                    </thead>
                    <tbody>
                        {accounts.map((account) => (
                            <tr key={account.id}>
                                <td>
                                    <Link className="account-link" href={`/accounts/${account.id}`}>
                                        {account.username}
                                    </Link>
                                    <span className="account-secondary">{account.email ?? account.id}</span>
                                </td>
                                <td>{account.authProvider === "ANONYMOUS" ? "Guest" : "Registered"}</td>
                                <td>{account.role}</td>
                                <td>
                                    <span className={account.active ? "status status--active" : "status"}>
                                        {statusLabel(account)}
                                    </span>
                                    {account.sessionCount > 0 ? (
                                        <span className="account-secondary">
                                            {account.sessionCount} session{account.sessionCount === 1 ? "" : "s"}
                                        </span>
                                    ) : null}
                                </td>
                                <td>{new Date(account.createdAt).toLocaleString("en")}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {accounts.length === 0 ? (
                    <p className="empty-state">No accounts match these filters.</p>
                ) : null}
            </div>

            {error ? <p className="error" role="alert">{error}</p> : null}
            {cursor ? (
                <div className="load-more">
                    <button className="button button--secondary" onClick={loadMore} disabled={loadingMore}>
                        {loadingMore ? "Loading…" : "Load 25 more"}
                    </button>
                </div>
            ) : null}
        </>
    );
}
