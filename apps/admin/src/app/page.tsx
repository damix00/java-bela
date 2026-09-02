import Link from "next/link";

import { logout } from "@/actions/auth";
import { getAdminAnalytics } from "@/lib/api/analytics";

export const dynamic = "force-dynamic";

type Metric = { label: string; value: number };

function MetricGrid({ metrics }: { metrics: Metric[] }) {
    return (
        <dl className="metrics">
            {metrics.map((metric) => (
                <div className="metric" key={metric.label}>
                    <dt>{metric.label}</dt>
                    <dd>{metric.value.toLocaleString("en")}</dd>
                </div>
            ))}
        </dl>
    );
}

function Failure({ message }: { message: string }) {
    return (
        <main className="page page--narrow">
            <section className="panel">
                <h1>Analytics unavailable</h1>
                <p className="error">{message}</p>
                <div className="header-actions">
                    <Link href="/">Retry</Link>
                    <form action={logout}>
                        <button className="button button--secondary" type="submit">
                            Sign out
                        </button>
                    </form>
                </div>
            </section>
        </main>
    );
}

export default async function DashboardPage() {
    const result = await getAdminAnalytics();

    if (result.state === "unauthenticated") {
        return <Failure message="Your session is no longer valid." />;
    }
    if (result.state === "forbidden") {
        return <Failure message="This account no longer has administrator access." />;
    }
    if (result.state === "unavailable") {
        return <Failure message={result.message} />;
    }

    const { data } = result;
    const users: Metric[] = [
        { label: "Total accounts", value: data.users.total },
        { label: "Registered accounts", value: data.users.registered },
        { label: "Current guest accounts", value: data.users.guests },
        { label: "Administrators", value: data.users.admins },
        { label: "Registered in last 24 hours", value: data.users.registeredLast24Hours },
        { label: "Registered in last 7 days", value: data.users.registeredLast7Days },
        { label: "Registered in last 30 days", value: data.users.registeredLast30Days },
    ];
    const activity: Metric[] = [
        { label: "Connected users", value: data.activity.connectedUsers },
        { label: "Live sessions", value: data.activity.sessions },
        { label: "Lobbies", value: data.activity.lobbiesTotal },
        { label: "Lobbies: open", value: data.activity.lobbiesInLobby },
        { label: "Lobbies: matchmaking", value: data.activity.lobbiesMatchmaking },
        { label: "Lobbies: in game", value: data.activity.lobbiesInGame },
        { label: "Games", value: data.activity.gamesTotal },
        { label: "Games: waiting", value: data.activity.gamesWaiting },
        { label: "Games: in progress", value: data.activity.gamesInProgress },
        { label: "Games: finished", value: data.activity.gamesFinished },
    ];

    return (
        <main className="page">
            <header className="header">
                <div>
                    <h1>Bela Admin</h1>
                    <p className="muted">
                        Snapshot generated {new Date(data.generatedAt).toLocaleString("en")}
                    </p>
                </div>
                <div className="header-actions">
                    <Link href="/">Refresh</Link>
                    <form action={logout}>
                        <button className="button button--secondary" type="submit">
                            Sign out
                        </button>
                    </form>
                </div>
            </header>

            <section className="section" aria-labelledby="users-title">
                <h2 id="users-title">Users</h2>
                <MetricGrid metrics={users} />
            </section>

            <section className="section" aria-labelledby="activity-title">
                <h2 id="activity-title">Live activity</h2>
                <MetricGrid metrics={activity} />
            </section>
        </main>
    );
}
