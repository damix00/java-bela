/**
 * Legal copy is structured data, not a blob of markup. The renderer walks these
 * blocks and knows nothing about which document it's drawing, so a clause added
 * to one locale is a `tsc` error until the other locale grows the same shape.
 */

export type LegalBlock =
  | { kind: "p"; text: string }
  | { kind: "list"; items: readonly string[] }
  /** Two-column stack for purpose/lawful basis or data/retention period. */
  | { kind: "rows"; rows: readonly { label: string; text: string }[] };

export type LegalSection = {
  /** Stable English slug used by both locale-prefixed legal routes. */
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
