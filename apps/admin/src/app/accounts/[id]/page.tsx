import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { logout } from "@/actions/auth";
import { AccountActions } from "@/app/accounts/account-actions";
import { getAdminAccount } from "@/lib/api/accounts";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ id: string }> };

function show(value: string | null | undefined) {
    return value || "—";
}

export default async function AccountDetailPage({ params }: PageProps) {
    const { id } = await params;
    const result = await getAdminAccount(id);
    if (result.state === "unauthenticated") {
        redirect("/login?error=expired");
    }
    if (result.state === "not-found") {
        notFound();
    }
    if (result.state !== "ready") {
        return (
            <main className="page page--narrow">
                <section className="panel">
                    <h1>Account unavailable</h1>
                    <p className="error">
                        {result.state === "error" ? result.message : "Administrator access is required."}
                    </p>
                    <Link href="/accounts">Back to accounts</Link>
                </section>
            </main>
        );
    }

    const account = result.data;
    return (
        <main className="page">
            <header className="header">
                <div>
                    <Link className="back-link" href="/accounts">← Accounts</Link>
                    <h1>{account.username}</h1>
                    <p className="muted">{account.id}</p>
                </div>
                <div className="header-actions">
                    <Link href="/">Dashboard</Link>
                    <form action={logout}>
                        <button className="button button--secondary" type="submit">Sign out</button>
                    </form>
                </div>
            </header>

            <section className="section" aria-labelledby="profile-title">
                <h2 id="profile-title">Account</h2>
                <dl className="detail-grid">
                    <div><dt>Email</dt><dd>{show(account.email)}</dd></div>
                    <div><dt>Type</dt><dd>{account.authProvider === "ANONYMOUS" ? "Guest" : "Registered"}</dd></div>
                    <div><dt>Role</dt><dd>{account.role}</dd></div>
                    <div><dt>Country</dt><dd>{show(account.countryCode)}</dd></div>
                    <div><dt>Created</dt><dd>{new Date(account.createdAt).toLocaleString("en")}</dd></div>
                    <div><dt>Last login</dt><dd>{account.lastLoginAt ? new Date(account.lastLoginAt).toLocaleString("en") : "—"}</dd></div>
                    <div className="detail-grid__wide"><dt>Bio</dt><dd>{show(account.bio)}</dd></div>
                </dl>
            </section>

            <section className="section" aria-labelledby="presence-title">
                <h2 id="presence-title">Presence</h2>
                <dl className="detail-grid">
                    <div><dt>Status</dt><dd>{account.presence.status.replaceAll("_", " ")}</dd></div>
                    <div><dt>Last ping</dt><dd>{account.presence.lastPing ? new Date(account.presence.lastPing).toLocaleString("en") : "—"}</dd></div>
                    <div><dt>Lobby</dt><dd>{show(account.presence.lobbyId)}</dd></div>
                    <div><dt>Game</dt><dd>{show(account.presence.gameId)}</dd></div>
                </dl>
            </section>

            <section className="section" aria-labelledby="sessions-title">
                <h2 id="sessions-title">Live sessions ({account.sessions.length})</h2>
                {account.sessions.length === 0 ? (
                    <p className="muted">No live WebSocket sessions.</p>
                ) : (
                    <div className="session-list">
                        {account.sessions.map((session) => (
                            <article className="session-card" key={session.id}>
                                <div className="session-card__header">
                                    <strong>{session.active ? "Active seat" : "Connected"}</strong>
                                    <span>{session.createdAt ? new Date(session.createdAt).toLocaleString("en") : "Unknown start"}</span>
                                </div>
                                <dl>
                                    <div><dt>IP address</dt><dd>{show(session.ipAddress)}</dd></div>
                                    <div><dt>User agent</dt><dd>{show(session.userAgent)}</dd></div>
                                    <div><dt>Session ID</dt><dd>{session.id}</dd></div>
                                </dl>
                            </article>
                        ))}
                    </div>
                )}
            </section>

            <AccountActions account={account} />
        </main>
    );
}
