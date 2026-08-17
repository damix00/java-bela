import { entity } from "./entity";
import type { LegalDocument } from "./types";

/**
 * Reference version of the Terms. `terms.hr.ts` mirrors it clause for clause.
 *
 * TODO(legal): reviewed by a Croatian lawyer before launch — the payments,
 * liability and licence clauses in particular.
 */
const terms = {
  title: "Terms of Service",
  updatedLabel: "Last updated",
  updated: "17 August 2026",
  lede: `These terms are the agreement between you and ${entity.name} for the use of ${entity.site}. They cover what you can expect from us, what we expect from you, and — in the section on game data and licence — the rights you give us over the data your play produces. Please read that section closely.`,
  tocLabel: "Contents",
  sections: [
    {
      id: "who-we-are",
      heading: "Who we are and what this covers",
      blocks: [
        {
          kind: "p",
          text: `${entity.site} (the “Service”) is an online Belote card game operated by ${entity.name}, ${entity.address}, OIB ${entity.oib}, registered at ${entity.registration}.`,
        },
        {
          kind: "p",
          text: "These terms apply the moment you use the Service — whether you create an account, play as a guest, or simply browse the site. If you do not accept them, do not use the Service.",
        },
        {
          kind: "p",
          text: "Our Privacy Policy explains what we do with personal data and forms part of these terms.",
        },
      ],
    },
    {
      id: "eligibility",
      heading: "Who may use the Service",
      blocks: [
        {
          kind: "p",
          text: "You must be at least 16 years old to use the Service. If you are under 16, you may not create an account or play, even as a guest.",
        },
        {
          kind: "p",
          text: "You must give accurate registration details, keep one account per person, and not use the Service where doing so would break the law that applies to you.",
        },
      ],
    },
    {
      id: "accounts",
      heading: "Accounts, usernames and guest play",
      blocks: [
        {
          kind: "p",
          text: "You are responsible for everything that happens under your account, and for keeping your password to yourself. Tell us promptly if you think someone else has access.",
        },
        {
          kind: "p",
          text: "Your username is public. We may rename, reclaim or block a username that impersonates someone, infringes a trademark, is offensive, or is being used to advertise. We may also reclaim usernames on long-dormant accounts.",
        },
        {
          kind: "p",
          text: "You can play as a guest without registering. Guest sessions are temporary and unranked: the guest account and its credentials are deleted automatically, typically within 24 hours, and progress attached to a guest account cannot be recovered or transferred once it is gone.",
        },
        {
          kind: "p",
          text: "You may close your account at any time. What happens to your data afterwards is set out in the Privacy Policy and in the section on game data and licence below.",
        },
      ],
    },
    {
      id: "fair-play",
      heading: "Fair play and acceptable use",
      blocks: [
        {
          kind: "p",
          text: "Belote is a partnership game, and its integrity depends entirely on people playing it honestly. You agree not to:",
        },
        {
          kind: "list",
          items: [
            "collude with other players, share knowledge of your cards outside the game, or arrange results in advance;",
            "use bots, solvers, scripts, or any software or assistance that plays or advises on your behalf, or play on behalf of someone else;",
            "run more than one account, share an account, or use another person’s account;",
            "manipulate ratings, seasons, leaderboards or matchmaking, including by deliberately losing, farming a partner, or abandoning games to avoid a loss;",
            "abuse, harass, threaten, impersonate or spam other players, in chat or by any other means;",
            "upload or display unlawful, hateful, sexual or infringing content, including as an avatar or username;",
            "scrape, crawl or bulk-collect data from the Service, or resell access to it;",
            "reverse engineer, decompile, tamper with, or interfere with the Service, its clients, its protocol, or its security and rate limits;",
            "attempt to gain unauthorised access to any account, server or system, or disrupt other players’ ability to play.",
          ],
        },
        {
          kind: "p",
          text: "If we believe you have broken these rules, we may — at our discretion and without prior notice — remove content, void games, adjust or reset your rating, remove you from leaderboards, restrict features, suspend you, or terminate your account permanently. Where the breach is serious or repeated we may also block associated devices and network addresses.",
        },
        {
          kind: "p",
          text: `If you think a decision was wrong, write to ${entity.supportEmail} and we will look at it again. We do not, however, guarantee a particular outcome, and we may keep our detection methods confidential — explaining them in detail would make them easy to defeat.`,
        },
      ],
    },
    {
      id: "ranked-play",
      heading: "Ranked play, ratings and leaderboards",
      blocks: [
        {
          kind: "p",
          text: "Ranked play uses a rating that moves with your results. It may involve placement games before a rating is shown, and ratings may be reset or recalibrated at the start of a season.",
        },
        {
          kind: "p",
          text: "A rating is a feature of the Service, not property, and it has no monetary value. We may change the rating system, the season length, the matchmaking rules, or the way ratings are calculated, and we may adjust, recalculate, reset or remove any rating — including yours — where we consider it necessary for the integrity of the ladder or after a fault in the system.",
        },
        {
          kind: "p",
          text: "Leaderboards, profiles and replays are public by default. Your username, avatar, rating, ranking position, match history and the record of your play may be visible to anyone on the internet, including people without an account, and may be indexed by search engines. Do not use a username you are not comfortable making public.",
        },
      ],
    },
    {
      id: "your-content",
      heading: "Your content",
      blocks: [
        {
          kind: "p",
          text: "“User Content” means anything you submit or display through the Service: your username, avatar, profile details, chat messages, table names, and anything you send us in support correspondence or feedback.",
        },
        {
          kind: "p",
          text: "You keep whatever ownership rights you already have in your User Content. You are responsible for it, and you confirm you have the rights needed to submit it. We may remove User Content that breaks these terms or the law.",
        },
        {
          kind: "p",
          text: "You grant us the licence described in the next section over your User Content, and we may act on suggestions and feedback you send us freely, without owing you anything for them.",
        },
      ],
    },
    {
      id: "data-licence",
      heading: "Game data and licence",
      blocks: [
        {
          kind: "p",
          text: "This section is the one we most want you to notice, because it is broader than you may expect.",
        },
        {
          kind: "p",
          text: "“Game Data” means all data generated by or in connection with play on the Service, including: bids and contracts, cards dealt and played, declarations and their scoring, trick and hand outcomes, final scores, timings and thinking times, disconnections and substitutions, table and seat configuration, ratings and rating changes, replays, in-game chat, matchmaking records, and the metadata and identifiers that tie all of it to accounts, sessions and devices.",
        },
        {
          kind: "p",
          text: "You grant us a perpetual, irrevocable, worldwide, non-exclusive, royalty-free, fully paid-up, transferable and sublicensable licence to host, store, reproduce, adapt, modify, translate, analyse, aggregate, combine with other data, create derivative works from, publicly display, distribute, publish, license and otherwise exploit all Game Data and User Content, in whole or in part, in any medium and by any means now known or later developed, for any purpose.",
        },
        {
          kind: "p",
          text: "That purpose expressly includes, without limitation:",
        },
        {
          kind: "list",
          items: [
            "developing, training, fine-tuning, evaluating, benchmarking and deploying artificial intelligence and machine-learning models and card-playing engines, including models we make available to others or use commercially;",
            "building, publishing, licensing and selling datasets derived from Game Data, including for research and for training by third parties;",
            "research, statistics, analytics, product development, anti-cheat and abuse detection;",
            "showing replays, hands, statistics and leaderboard data publicly, and using them in documentation, marketing and press material;",
            "licensing or transferring any of the above to partners, contractors, service providers, and to a buyer or successor in a sale, merger or reorganisation of our business.",
          ],
        },
        {
          kind: "p",
          text: "We may exercise this licence without notice to you, without attribution, and without any payment, revenue share or other compensation, and we may do so in identifiable, pseudonymised, aggregated or anonymised form. You waive any moral rights or similar rights you may have in Game Data to the extent the law allows you to waive them.",
        },
        {
          kind: "p",
          text: "This licence survives the closing, suspension or deletion of your account. Once Game Data has been used to train a model, or has been incorporated into an aggregate, a dataset or a published statistic, that model, aggregate, dataset or statistic is not undone by your later deletion of your account — and we are not obliged to retrain, rebuild or withdraw it.",
        },
        {
          kind: "p",
          text: "Where Game Data is personal data, the Privacy Policy governs how we handle it, and this licence does not override the rights the GDPR gives you — including your right to object to processing carried out on the basis of our legitimate interests. Nothing in this section is intended to take away a right you cannot lawfully give up.",
        },
      ],
    },
    {
      id: "payments",
      heading: "Paid features and subscriptions",
      blocks: [
        {
          kind: "p",
          text: "The Service is currently free. If we introduce paid features or subscriptions, the terms in this section apply to them.",
        },
        {
          kind: "p",
          text: "Prices are shown before you buy and include VAT where VAT applies. Payments are handled by a third-party payment provider; we do not receive or store your full card details. You are responsible for keeping your payment details up to date.",
        },
        {
          kind: "p",
          text: "Subscriptions renew automatically for the same period until cancelled. You can cancel at any time, with effect from the end of the period you have already paid for; cancelling does not refund the current period unless the law requires it. We will give you reasonable notice before a price change takes effect, and you may cancel rather than accept it.",
        },
        {
          kind: "p",
          text: "As a consumer in the EU you normally have 14 days to withdraw from a distance contract. Where you buy digital content or a digital service that we start supplying immediately, you ask us to begin at once and acknowledge that you lose the right of withdrawal once supply has begun and, for digital content, once it has been delivered in full. Nothing here affects your statutory rights where the digital content or service turns out to be faulty or not as described.",
        },
        {
          kind: "p",
          text: "Virtual items, cosmetics, ratings and other in-game entitlements are a licence to use them within the Service. They have no cash value, cannot be exchanged for money, and cannot be sold or transferred outside the Service.",
        },
      ],
    },
    {
      id: "availability",
      heading: "Availability, changes and warranties",
      blocks: [
        {
          kind: "p",
          text: "The Service is under active development. We may add, change, suspend or remove features — including ranked play, replays, seasons and AI opponents — and we may take the Service down for maintenance, or discontinue it entirely, at any time.",
        },
        {
          kind: "p",
          text: "We do not promise any particular level of uptime, that play will be free of disconnections or faults, that an AI substitute will play your seat the way you would, or that data will never be lost. Beyond the guarantees that consumer law gives you and that we cannot exclude, the Service is provided as it is and as available.",
        },
      ],
    },
    {
      id: "termination",
      heading: "Suspension and termination",
      blocks: [
        {
          kind: "p",
          text: "You may stop using the Service and close your account at any time.",
        },
        {
          kind: "p",
          text: "We may suspend or terminate your access, with notice where reasonably possible and without it where a delay would cause harm, if you breach these terms, if we are required to by law, or if we discontinue the Service.",
        },
        {
          kind: "p",
          text: "On termination your right to use the Service ends. The sections on game data and licence, liability, and governing law continue to apply, and Game Data is retained as described in the Privacy Policy.",
        },
      ],
    },
    {
      id: "liability",
      heading: "Liability",
      blocks: [
        {
          kind: "p",
          text: "We are liable to you for damage we cause by intent or gross negligence, for death or personal injury caused by our negligence, and for anything else that Croatian or EU consumer law does not let us exclude. Nothing in these terms limits that liability.",
        },
        {
          kind: "p",
          text: "Otherwise, and to the extent the law allows: we are not liable for indirect or consequential loss, lost profit, lost data, lost ratings or lost opportunity; we are not liable for what other players do; and our total liability arising from the Service is limited to the greater of the amount you paid us in the twelve months before the event and EUR 100. Because the Service is free unless you buy something, this will usually mean EUR 100.",
        },
      ],
    },
    {
      id: "changes",
      heading: "Changes to these terms",
      blocks: [
        {
          kind: "p",
          text: "We may change these terms — for example when we add features, or when the law changes. The date at the top shows when we last did.",
        },
        {
          kind: "p",
          text: "If a change materially affects your rights, we will give you reasonable notice before it takes effect, by email or in the Service. Continuing to use the Service after a change takes effect means you accept the new terms; if you do not accept them, close your account.",
        },
      ],
    },
    {
      id: "law",
      heading: "Governing law and disputes",
      blocks: [
        {
          kind: "p",
          text: "These terms are governed by the law of the Republic of Croatia. If you are a consumer resident in the EU, you also keep the protection of the mandatory consumer law of the country you live in, and you may bring proceedings in the courts there; we may only bring proceedings against you in those courts.",
        },
        {
          kind: "p",
          text: `Please write to ${entity.supportEmail} first — most disputes are a misunderstanding, and we would rather fix it than argue about it. If we cannot resolve a complaint, you may be able to use an alternative dispute resolution body or the European Commission’s online dispute resolution platform, and you may complain to the Croatian consumer protection authorities.`,
        },
        {
          kind: "p",
          text: "If any provision of these terms turns out to be unenforceable, the rest stays in force and the unenforceable part applies to the greatest extent the law allows.",
        },
      ],
    },
    {
      id: "language",
      heading: "Language",
      blocks: [
        {
          kind: "p",
          text: "These terms are published in Croatian and in English. The Croatian version prevails if the two versions differ.",
        },
      ],
    },
    {
      id: "contact",
      heading: "Contact",
      blocks: [
        {
          kind: "rows",
          rows: [
            { label: "Operator", text: `${entity.name}, ${entity.address}` },
            { label: "OIB", text: entity.oib },
            { label: "Support", text: entity.supportEmail },
            { label: "Privacy and data requests", text: entity.privacyEmail },
          ],
        },
      ],
    },
  ],
} satisfies LegalDocument;

export default terms;
