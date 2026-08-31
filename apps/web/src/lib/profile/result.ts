import type { User } from "@/api/types/user";

/**
 * The shapes `actions/profile.ts` returns, and the one code its callers branch
 * on rather than show.
 *
 * They live out here because a `"use server"` module may only export async
 * functions — a plain `const` in that file is a build error, since every export
 * of an actions file becomes a callable endpoint. Types would survive the rule
 * by being erased, but keeping them next to the constant is what makes the
 * split legible.
 */
export const SESSION_EXPIRED = "SESSION_EXPIRED";

export type ProfileValues = {
    username: string;
    bio: string;
    countryCode: string;
};

/**
 * What `updateProfile` accepts, which is not quite the profile form.
 *
 * `PATCH /users/me` treats an absent field as untouched, and the welcome step
 * asks for a bio and a country only — the name was already chosen at sign-up,
 * and sending it back unchanged would put that screen through the uniqueness
 * check for nothing.
 */
export type ProfileUpdate = Omit<ProfileValues, "username"> &
    Partial<Pick<ProfileValues, "username">>;

export type ProfileActionResult =
    { ok: true; user: User } | { ok: false; error: string; code?: string };

export type ActionResult =
    { ok: true } | { ok: false; error: string; code?: string };
