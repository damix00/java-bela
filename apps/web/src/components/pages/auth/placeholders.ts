/**
 * Stand-in values for the screens, which are visual-only until the auth
 * backend lands. Kept in one file so there's a single place to delete from
 * when real fields, sessions and ratings arrive.
 */
export const demoAccount = {
  email: "marko@example.com",
  username: "marko.z",
  password: "stihovi1937",
  rating: "1482",
  /** Where the new name lands on the ladder, and who's under it. */
  ladderRank: "14.",
  neighbourRank: "15.",
  neighbourName: "jelena_k",
  neighbourRating: "1471",
  placementPlayed: 0,
  placementTotal: 5,
  /** Prefilled digits on the two-factor screen. */
  code: ["4", "9", "1", "", "", ""],
} as const;
