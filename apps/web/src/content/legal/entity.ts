/**
 * The one place the operator's real identity gets filled in. Both English legal
 * documents interpolate these values so the company details cannot drift.
 *
 * TODO(legal): replace every bracketed placeholder before launch. A published
 * privacy policy without a named controller and a working address is itself a
 * GDPR failure (Art. 13(1)(a)).
 */
export const entity = {
    /** Registered company name, e.g. "Belote d.o.o.". */
    name: "[LEGAL ENTITY NAME]",
    /**
     * Street, postcode, city, and no country name. This string is dropped
     * verbatim into the English documents, so include the country if needed for
     * a legally complete postal address.
     */
    address: "[STREET AND NUMBER, POSTCODE CITY]",
    /** Croatian personal identification number of the company. */
    oib: "[OIB]",
    /** Court register / MBS entry. */
    registration: "[COMMERCIAL COURT AND REGISTRATION NUMBER]",
    site: "belote.gg",
    privacyEmail: "privacy@belote.gg",
    supportEmail: "support@belote.gg",
} as const;

/** The Croatian supervisory authority, cited in both privacy policies. */
export const supervisor = {
    name: "Agencija za zaštitu osobnih podataka (AZOP)",
    address: "Selska cesta 136, 10000 Zagreb, Croatia",
    site: "azop.hr",
} as const;
