import { login } from "@/actions/auth";

const errorMessages: Record<string, string> = {
    invalid: "The email or password is incorrect.",
    forbidden: "This account does not have administrator access.",
    expired: "Your administrator session expired. Sign in again.",
    unavailable: "The API is unavailable. Try again shortly.",
};

export default async function LoginPage({
    searchParams,
}: {
    searchParams: Promise<{ error?: string }>;
}) {
    const { error } = await searchParams;
    const message = error ? errorMessages[error] : null;

    return (
        <main className="page page--narrow">
            <section className="panel" aria-labelledby="login-title">
                <h1 id="login-title">Bela Admin</h1>
                <p className="muted">Sign in with an administrator account.</p>
                {message ? (
                    <p className="error" role="alert">
                        {message}
                    </p>
                ) : null}
                <form className="form" action={login}>
                    <label className="field">
                        <span>Email</span>
                        <input
                            name="email"
                            type="email"
                            autoComplete="username"
                            required
                        />
                    </label>
                    <label className="field">
                        <span>Password</span>
                        <input
                            name="password"
                            type="password"
                            autoComplete="current-password"
                            required
                        />
                    </label>
                    <button className="button" type="submit">
                        Sign in
                    </button>
                </form>
            </section>
        </main>
    );
}
