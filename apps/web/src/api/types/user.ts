/**
 * Session and user shapes for the auth layer.
 *
 * These are written out rather than aliased to `UserResponse` from
 * `@bela/protocol`, even though that type is generated from the very Java DTO
 * these come from. The generator cannot see nullability: it emits `email:
 * string` and `avatarUrl: string`, but an anonymous account has neither, and
 * `createdAt: Date` is a string by the time it has crossed JSON. Inheriting
 * those would push a lie into every consumer. Keep this file in step with
 * `user/auth/dto/response/UserResponse.java` by hand.
 */
export type User = {
  id: string;
  username: string;
  /** Null for anonymous accounts, which are created without one. */
  email: string | null;
  avatarUrl: string | null;
  role: string;
  /** ISO-8601 — `Instant` on the wire, never revived into a Date. */
  createdAt: string;
  lastLoginAt: string | null;
};

/**
 * What the Next server hands to the browser. The refresh token is deliberately
 * absent — it lives only in an httpOnly cookie and never crosses into client JS.
 */
export type AuthResponse = {
  accessToken: string;
  /** Access token lifetime in seconds. */
  expiresIn: number;
  user: User;
};

/** The backend's response shape, seen only by server-side code. */
export type BackendAuthResponse = {
  accessToken: string;
  /** Null when a rotation landed in the grace window and the current token stays valid. */
  refreshToken: string | null;
  expiresIn: number;
  refreshExpiresIn: number;
  user: User;
};

/** An account the backend created on the fly, with no credentials behind it. */
export function isGuest(user: User): boolean {
  return user.email === null;
}
