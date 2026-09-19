"use client";

import type { AdminAccountDetailResponse } from "@bela/protocol";
import { useActionState } from "react";

import {
    changeRoleAction,
    deleteAccountAction,
    forceSignOutAction,
    initialAccountActionState,
} from "@/actions/accounts";

function ActionMessage({ state }: { state: typeof initialAccountActionState }) {
    if (state.status === "idle") {
        return null;
    }
    return (
        <p
            aria-live="polite"
            className={state.status === "error" ? "error" : "success"}
        >
            {state.message}
        </p>
    );
}

export function AccountActions({ account }: { account: AdminAccountDetailResponse }) {
    const [signOutState, signOut, signOutPending] = useActionState(
        forceSignOutAction.bind(null, account.id),
        initialAccountActionState,
    );
    const [roleState, changeRole, rolePending] = useActionState(
        changeRoleAction.bind(null, account.id),
        initialAccountActionState,
    );
    const [deleteState, deleteAccount, deletePending] = useActionState(
        deleteAccountAction.bind(null, account.id),
        initialAccountActionState,
    );
    const nextRole = account.role === "ADMIN" ? "USER" : "ADMIN";

    return (
        <section className="section action-stack" aria-labelledby="actions-title">
            <h2 id="actions-title">Manage account</h2>

            {account.actions.canForceSignOut ? (
                <form action={signOut} className="action-card">
                    <div>
                        <h3>Force sign out</h3>
                        <p className="muted">
                            Revoke all tokens and close every live connection.
                        </p>
                    </div>
                    <button className="button button--secondary" disabled={signOutPending}>
                        {signOutPending ? "Signing out…" : "Force sign out"}
                    </button>
                    <ActionMessage state={signOutState} />
                </form>
            ) : null}

            <form action={changeRole} className="action-card">
                <div>
                    <h3>Change role to {nextRole}</h3>
                    <p className="muted">
                        Type <strong>{account.username}</strong> to confirm.
                    </p>
                </div>
                <input type="hidden" name="role" value={nextRole} />
                <input
                    aria-label="Username confirmation for role change"
                    name="confirmUsername"
                    placeholder={account.username}
                    required
                    disabled={!account.actions.canChangeRole || rolePending}
                />
                <button
                    className="button button--secondary"
                    disabled={!account.actions.canChangeRole || rolePending}
                >
                    {rolePending ? "Updating…" : `Change to ${nextRole}`}
                </button>
                {account.actions.roleChangeBlockedReason ? (
                    <p className="muted">{account.actions.roleChangeBlockedReason}</p>
                ) : null}
                <ActionMessage state={roleState} />
            </form>

            <form action={deleteAccount} className="action-card action-card--danger">
                <div>
                    <h3>Delete account permanently</h3>
                    <p className="muted">
                        Type <strong>{account.username}</strong> to confirm. This cannot be undone.
                    </p>
                </div>
                <input
                    aria-label="Username confirmation for account deletion"
                    name="confirmUsername"
                    placeholder={account.username}
                    required
                    disabled={!account.actions.canDelete || deletePending}
                />
                <button
                    className="button button--danger"
                    disabled={!account.actions.canDelete || deletePending}
                >
                    {deletePending ? "Deleting…" : "Delete account"}
                </button>
                {account.actions.deletionBlockedReason ? (
                    <p className="muted">{account.actions.deletionBlockedReason}</p>
                ) : null}
                <ActionMessage state={deleteState} />
            </form>
        </section>
    );
}
