"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
    changeAdminAccountRole,
    deleteAdminAccount,
    forceAdminAccountSignOut,
    type AccountApiResult,
} from "@/lib/api/accounts";

export type AccountActionState = {
    status: "idle" | "success" | "error";
    message: string;
};

export const initialAccountActionState: AccountActionState = {
    status: "idle",
    message: "",
};

function errorState(result: AccountApiResult<unknown>): AccountActionState {
    if (result.state === "unauthenticated") {
        return { status: "error", message: "Your administrator session has expired." };
    }
    if (result.state === "forbidden") {
        return { status: "error", message: "You no longer have administrator access." };
    }
    if (result.state === "not-found") {
        return { status: "error", message: "This account no longer exists." };
    }
    return {
        status: "error",
        message: result.state === "error" ? result.message : "The action failed.",
    };
}

export async function forceSignOutAction(
    accountId: string,
    _previousState: AccountActionState,
): Promise<AccountActionState> {
    void _previousState;
    const result = await forceAdminAccountSignOut(accountId);
    if (result.state !== "ready") {
        return errorState(result);
    }
    revalidatePath(`/accounts/${accountId}`);
    revalidatePath("/accounts");
    return { status: "success", message: "All sessions were signed out." };
}

export async function changeRoleAction(
    accountId: string,
    _previousState: AccountActionState,
    formData: FormData,
): Promise<AccountActionState> {
    const role = formData.get("role");
    const confirmUsername = formData.get("confirmUsername");
    if (typeof role !== "string" || typeof confirmUsername !== "string") {
        return { status: "error", message: "Role and username confirmation are required." };
    }

    const result = await changeAdminAccountRole(accountId, role, confirmUsername);
    if (result.state !== "ready") {
        return errorState(result);
    }
    revalidatePath(`/accounts/${accountId}`);
    revalidatePath("/accounts");
    return { status: "success", message: "The account role was updated." };
}

export async function deleteAccountAction(
    accountId: string,
    _previousState: AccountActionState,
    formData: FormData,
): Promise<AccountActionState> {
    const confirmUsername = formData.get("confirmUsername");
    if (typeof confirmUsername !== "string") {
        return { status: "error", message: "Username confirmation is required." };
    }

    const result = await deleteAdminAccount(accountId, confirmUsername);
    if (result.state !== "ready") {
        return errorState(result);
    }
    revalidatePath("/accounts");
    redirect("/accounts?deleted=1");
}
