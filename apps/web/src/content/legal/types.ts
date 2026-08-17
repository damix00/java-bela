/**
 * Legal copy is structured data, not a blob of markup. The renderer walks these
 * blocks and knows nothing about which document it's drawing, so a clause added
 * to one locale is a `tsc` error until the other locale grows the same shape.
 */

export type LegalBlock =
  | { kind: "p"; text: string }
  | { kind: "list"; items: readonly string[] }
  /** Two-column stack — purpose/lawful basis, data/retention period. */
  | { kind: "rows"; rows: readonly { label: string; text: string }[] };

export type LegalSection = {
  /**
   * Always the English slug, in both locales: the anchor has to survive a
   * language switch, and `LanguageSwitcher` only swaps the locale prefix.
   */
  id: string;
  heading: string;
  blocks: readonly LegalBlock[];
};

export type LegalDocument = {
  title: string;
  lede: string;
  updatedLabel: string;
  updated: string;
  tocLabel: string;
  sections: readonly LegalSection[];
};
