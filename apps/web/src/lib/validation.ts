import { z } from "zod";

import type { Dictionary } from "@/dictionaries";

/**
 * The auth schemas. Every message is passed in rather than baked into the
 * schema: the copy is localised, so a schema can only be built once the
 * dictionary for the render is in hand — hence the factory per form rather
 * than a module-level constant.
 *
 * These are the client's half of the contract. The API validates again on its
 * own terms; nothing here is a security boundary, it is the field telling the
 * player what it will accept before the round trip.
 */

export type FormErrors = Dictionary["form"]["errors"];

export const PASSWORD_MIN = 8;
export const USERNAME_MIN = 3;
export const USERNAME_MAX = 16;
export const CODE_LENGTH = 6;

/** Letters, digits, and the three separators a username may carry. */
const USERNAME_PATTERN = /^[a-zA-Z0-9._-]+$/;

// `.pipe`, not a second check on the same string: piping short-circuits, so an
// empty box is reported as empty rather than as a malformed address.
const emailField = (t: FormErrors) =>
    z.string().trim().min(1, t.emailRequired).pipe(z.email(t.emailInvalid));

/** Sign-in only asks that something was typed — length rules are the server's. */
const currentPassword = (t: FormErrors) =>
    z.string().min(1, t.passwordRequired);

/** A password being set, held to the rule printed under the field. */
const newPassword = (t: FormErrors) =>
    z.string().min(1, t.passwordRequired).min(PASSWORD_MIN, t.passwordShort);

/**
 * Shared by sign-up and the standalone username screen. Registration needs one
 * up front — `users.username` is NOT NULL UNIQUE and the API's register call
 * rejects a collision — so the two forms have to agree on what a name may be.
 */
const usernameField = (t: FormErrors) =>
    z
        .string()
        .trim()
        .min(1, t.usernameRequired)
        .min(USERNAME_MIN, t.usernameShort)
        .max(USERNAME_MAX, t.usernameLong)
        .regex(USERNAME_PATTERN, t.usernameChars);

export function signInSchema(t: FormErrors) {
    return z.object({
        email: emailField(t),
        password: currentPassword(t),
    });
}

export function signUpSchema(t: FormErrors) {
    return z.object({
        username: usernameField(t),
        email: emailField(t),
        password: newPassword(t),
        // A refinement rather than `z.literal(true)`: the box really does hold a
        // boolean, and typing the field as `true` would leave the form unable to
        // express its own starting state.
        terms: z.boolean().refine((agreed) => agreed, t.termsRequired),
    });
}

export function forgotPasswordSchema(t: FormErrors) {
    return z.object({ email: emailField(t) });
}

export function resetPasswordSchema(t: FormErrors) {
    return z.object({ password: newPassword(t) });
}

export function twoFactorSchema(t: FormErrors) {
    return z.object({
        code: z
            .string()
            .length(CODE_LENGTH, t.codeIncomplete)
            .regex(/^\d+$/, t.codeIncomplete),
    });
}

export function usernameSchema(t: FormErrors) {
    return z.object({
        username: usernameField(t),
        /** Index into `AVATAR_GLYPHS`; the picker can't produce a bad one. */
        avatar: z.number(),
    });
}

export type SignInValues = z.infer<ReturnType<typeof signInSchema>>;
export type SignUpValues = z.infer<ReturnType<typeof signUpSchema>>;
export type ForgotPasswordValues = z.infer<
    ReturnType<typeof forgotPasswordSchema>
>;
export type ResetPasswordValues = z.infer<
    ReturnType<typeof resetPasswordSchema>
>;
export type TwoFactorValues = z.infer<ReturnType<typeof twoFactorSchema>>;
export type UsernameValues = z.infer<ReturnType<typeof usernameSchema>>;

/**
 * Segments to fill on the strength meter, 0–4. Length carries most of the
 * weight because it is what actually costs an attacker time; the character
 * classes are worth one segment between them, so a short password with a
 * symbol in it can't read as strong.
 */
export function passwordStrength(value: string) {
    if (value.length < PASSWORD_MIN) return value.length === 0 ? 0 : 1;

    let score = 2;
    if (value.length >= 12) score += 1;
    if (/[^a-zA-Z]/.test(value) && /[a-zA-Z]/.test(value)) score += 1;

    return Math.min(score, 4);
}
