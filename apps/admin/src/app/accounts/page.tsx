import Link from "next/link";
import { redirect } from "next/navigation";

import { logout } from "@/actions/auth";
import { AccountBrowser } from "@/app/accounts/account-browser";
import { type AccountFilters, getAdminAccounts } from "@/lib/api/accounts";

export const dynamic = "force-dynamic";

type PageProps = {
    searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function valueOf(value: string | string[] | undefined) {
    return Array.isArray(value) ? value[0] : value;
}

export default async function AccountsPage({ searchParams }: PageProps) {
    const parameters = await searchParams;
    const filters: AccountFilters = {
        query: valueOf(parameters.query),
        accountType: valueOf(parameters.accountType),
        activity: valueOf(parameters.activity),
        role: valueOf(parameters.role),
    };
    const result = await getAdminAccounts(filters);
    if (result.state === "unauthenticated") {
        redirect("/login?error=expired");
    }

    return (
        <main className="page">
            <header className="header">
                <div>
                    <h1>Accounts</h1>
                    <p className="muted">Browse and manage registered and guest accounts.</p>
                </div>
                <div className="header-actions">
                    <Link href="/">Dashboard</Link>
                    <form action={logout}>
                        <button className="button button--secondary" type="submit">Sign out</button>
                    </form>
                </div>
            </header>

            {result.state === "ready" ? (
                <AccountBrowser
                    key={JSON.stringify(filters)}
                    initialPage={result.data}
                    initialFilters={filters}
                />
            ) : (
                <section className="panel">
                    <h2>Accounts unavailable</h2>
                    <p className="error">
                        {result.state === "error" ? result.message : "Administrator access is required."}
                    </p>
                </section>
            )}
        </main>
    );
}
