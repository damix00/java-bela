import { entity, supervisor } from "./entity";
import type { LegalDocument } from "./types";

/**
 * Reference version of the Privacy Policy. `privacy.hr.ts` mirrors it section
 * for section.
 *
 * Written to be broad about future processing but honest about the present:
 * where a category isn't collected yet it says “where we offer”, never that we
 * already do it.
 */
const privacy = {
  title: "Privacy Policy",
  updatedLabel: "Last updated",
  updated: "17 August 2026",
  lede: `This policy explains what personal data ${entity.name} collects when you use ${entity.site}, why we use it, and what you can ask us to do about it. The section on artificial intelligence and research matters most: we use the data your play produces to train models, and we want that stated plainly rather than buried.`,
  tocLabel: "Contents",
  sections: [
    {
      id: "controller",
      heading: "Who is responsible for your data",
      blocks: [
        {
          kind: "p",
          text: `The controller is ${entity.name}, ${entity.address}, OIB ${entity.oib}. For anything to do with your personal data, including the requests described below, write to ${entity.privacyEmail}.`,
        },
        {
          kind: "p",
          text: "This policy covers the website, the game clients, and the servers behind them. It does not cover other sites we link to.",
        },
      ],
    },
    {
      id: "what-we-collect",
      heading: "What we collect",
      blocks: [
        {
          kind: "rows",
          rows: [
            {
              label: "Account data",
              text: "Username, email address, a cryptographic hash of your password (never the password itself), avatar, account type, role, and the dates your account was created, updated and last signed in to.",
            },
            {
              label: "Session and technical data",
              text: "For each signed-in session we store the IP address and browser or device user-agent string alongside the session’s token records, and we keep short-lived request counters keyed to IP addresses in order to rate-limit abuse. Our servers also produce ordinary logs of requests and errors.",
            },
            {
              label: "Game data",
              text: "Everything your play produces: bids and contracts, cards dealt and played, declarations and scoring, hand and match results, timings and thinking times, disconnections and AI substitutions, table and seat setup, ratings and rating changes, replays, in-game chat, and matchmaking records — together with the identifiers that link all of it to your account and session.",
            },
            {
              label: "Cookies and local storage",
              text: "A single functional cookie storing your chosen language, plus the local storage the client needs to keep you signed in. If we add analytics or advertising cookies we will ask for your consent first.",
            },
            {
              label: "Payment data",
              text: "Where we offer paid features, our payment provider processes your payment details and gives us the record of the transaction — amount, date, status, and the country needed for VAT. We do not receive or store your full card number.",
            },
            {
              label: "Correspondence",
              text: "The content of support emails, bug reports, appeals and anything else you choose to send us.",
            },
          ],
        },
        {
          kind: "p",
          text: "We collect most of this from you directly or automatically as you play. We do not buy personal data about you, and we do not currently use third-party advertising or social login.",
        },
      ],
    },
    {
      id: "guest-accounts",
      heading: "Guest play",
      blocks: [
        {
          kind: "p",
          text: "You can play without registering. A guest account has no email address and no password you chose, and it is deleted automatically — typically within 24 hours — along with its session records. Guest play is unranked and its progress is not preserved.",
        },
        {
          kind: "p",
          text: "Game Data produced during guest play is retained as described in the retention section, on the same basis as any other Game Data.",
        },
      ],
    },
    {
      id: "why-we-use-it",
      heading: "Why we use it, and on what legal basis",
      blocks: [
        {
          kind: "rows",
          rows: [
            {
              label: "Running the Service — Art. 6(1)(b), contract",
              text: "Creating and maintaining your account, signing you in, matchmaking, running games, keeping ratings and leaderboards, storing replays, and providing support.",
            },
            {
              label: "Security and fair play — Art. 6(1)(f), legitimate interests",
              text: "Detecting collusion, bots, multi-accounting and rating manipulation; rate-limiting; investigating abuse reports; protecting accounts and infrastructure. Our interest is a game that is worth playing and a service that stays up.",
            },
            {
              label:
                "Product development, research and AI training — Art. 6(1)(f), legitimate interests",
              text: "Analysing Game Data to improve the Service, to produce statistics, and to build, train, evaluate and deploy artificial intelligence and machine-learning models, including card-playing engines and models we may make available or license to others. See the next section.",
            },
            {
              label: "Payments and accounting — Art. 6(1)(b) and (c)",
              text: "Taking payment where you buy something, and keeping the invoices and records that Croatian tax law requires us to keep.",
            },
            {
              label: "Legal obligations and claims — Art. 6(1)(c) and (f)",
              text: "Responding to lawful requests from authorities, and establishing, exercising or defending legal claims.",
            },
            {
              label: "Marketing email — Art. 6(1)(a), consent",
              text: "If we send news or offers by email, we do so only with your consent, and every message carries a one-click unsubscribe. Withdrawing consent does not affect anything we sent before.",
            },
          ],
        },
      ],
    },
    {
      id: "ai-training",
      heading: "Artificial intelligence, research and datasets",
      blocks: [
        {
          kind: "p",
          text: "We use Game Data to build things, and we intend to keep doing so. Specifically, we may:",
        },
        {
          kind: "list",
          items: [
            "train, fine-tune, evaluate and benchmark machine-learning models and card-playing engines on your games — including the AI opponents in the Service, and models we use commercially or make available to others;",
            "combine your Game Data with other players’ data and with data from other sources, and derive statistics, aggregates and features from it;",
            "compile datasets from Game Data and publish, share, license or sell them, including to researchers and to third parties who will train their own models on them;",
            "share Game Data with contractors, research partners and service providers who help us with any of the above;",
            "continue to use models, datasets, aggregates and statistics already derived from your Game Data after your account is closed.",
          ],
        },
        {
          kind: "p",
          text: "We do this on the basis of our legitimate interests. We have weighed those interests against your rights: Game Data is a record of moves in a card game rather than sensitive information, we use it in aggregated or pseudonymised form wherever that serves the purpose, and published or licensed datasets are stripped of direct identifiers such as your email address. Your username may remain attached where the data is about public play — replays and leaderboards are public features of the Service.",
        },
        {
          kind: "p",
          text: `Because this processing rests on legitimate interests, you have the right to object to it under Art. 21 GDPR. Write to ${entity.privacyEmail}. We will stop unless we can show compelling legitimate grounds that override your objection, and we will tell you either way. Objecting does not remove your Game Data from models that have already been trained — that cannot be undone — and it does not stop us processing what we need in order to run the game itself and keep it fair.`,
        },
        {
          kind: "p",
          text: "We do not make decisions with legal or similarly significant effect about you by automated means alone. Automated anti-cheat signals may restrict an account, and you can ask us to look at that decision again.",
        },
      ],
    },
    {
      id: "public-information",
      heading: "What is public",
      blocks: [
        {
          kind: "p",
          text: "Your username, avatar, rating, leaderboard position, match history and replays of your games are public by default. They can be seen by anyone on the internet, including people without an account, and search engines may index them.",
        },
        {
          kind: "p",
          text: "Choose a username accordingly: if it is your real name, that is a decision to publish your real name. In-game chat is visible to the other players at your table and is retained with the replay.",
        },
      ],
    },
    {
      id: "sharing",
      heading: "Who we share data with",
      blocks: [
        {
          kind: "list",
          items: [
            "infrastructure providers who host our servers, databases and caches, and who process data on our instructions under a data processing agreement;",
            "an email delivery provider, where we send account emails such as password resets;",
            "a payment provider, where we offer paid features;",
            "analytics providers, where we use analytics;",
            "research partners, contractors and third parties, as described in the section on artificial intelligence, research and datasets;",
            "courts, regulators and law enforcement, where we are legally required to disclose or where it is necessary to establish or defend legal claims;",
            "a buyer or successor, if our business or its assets are sold, merged or reorganised — including the Game Data and the models built from it.",
          ],
        },
        {
          kind: "p",
          text: "We do not sell your account data — your email address, your password, your correspondence — to anyone. Game Data is a different matter, and the section on artificial intelligence, research and datasets says exactly what we may do with it.",
        },
      ],
    },
    {
      id: "transfers",
      heading: "Transfers outside the EEA",
      blocks: [
        {
          kind: "p",
          text: "We prefer to keep data in the European Economic Area. Where a provider or partner processes data outside it, we rely on an adequacy decision by the European Commission or on the Commission’s standard contractual clauses together with any additional safeguards the transfer requires.",
        },
        {
          kind: "p",
          text: `You can ask us for details of the transfers relevant to you at ${entity.privacyEmail}.`,
        },
      ],
    },
    {
      id: "retention",
      heading: "How long we keep it",
      blocks: [
        {
          kind: "rows",
          rows: [
            {
              label: "Guest accounts",
              text: "Deleted automatically, typically within 24 hours of creation.",
            },
            {
              label: "Account data",
              text: "For as long as your account exists, and for a short period afterwards to complete deletion, resolve disputes and prevent ban evasion.",
            },
            {
              label: "Session records, IP addresses and user-agents",
              text: "Until the session’s tokens expire — 30 days at most for a registered account, 24 hours for a guest — after which they are pruned. Rate-limit counters are short-lived. Server logs are kept for a limited period for security and debugging.",
            },
            {
              label: "Game data",
              text: "Retained indefinitely, including after your account is closed, and including in models, datasets, aggregates and statistics derived from it. Where we no longer need it linked to you, we keep it in a form that is not tied to your account.",
            },
            {
              label: "Payment and accounting records",
              text: "For the period Croatian tax and accounting law requires, generally eleven years.",
            },
            {
              label: "Correspondence",
              text: "For as long as needed to handle the matter, and afterwards where it is relevant to a possible claim.",
            },
          ],
        },
      ],
    },
    {
      id: "your-rights",
      heading: "Your rights",
      blocks: [
        {
          kind: "p",
          text: "Under the GDPR you have the right to:",
        },
        {
          kind: "list",
          items: [
            "ask for a copy of the personal data we hold about you (Art. 15);",
            "have inaccurate data corrected (Art. 16);",
            "have data erased where the law requires it (Art. 17);",
            "ask us to restrict processing while a dispute is resolved (Art. 18);",
            "receive your data in a portable, machine-readable form (Art. 20);",
            "object to processing based on our legitimate interests, including the AI training described above (Art. 21);",
            "withdraw consent at any time, where we relied on consent (Art. 7);",
            "complain to a supervisory authority (Art. 77).",
          ],
        },
        {
          kind: "p",
          text: `Write to ${entity.privacyEmail} and we will respond within one month, or tell you why we need longer. We may ask you to confirm who you are before we act, so that nobody else can obtain your data by asking for it.`,
        },
        {
          kind: "p",
          text: "Two honest limits on erasure. First, deleting your account does not delete Game Data or the models, datasets and statistics already derived from it — we cannot untrain a model, and we rely on that data for the integrity of the game and for the purposes described above; what we will do is sever the direct link between that data and your account identity where we no longer need it. Second, we may keep what we must keep for accounting, security or legal claims. If you disagree with where we draw that line, say so, and you can take it to the supervisory authority.",
        },
      ],
    },
    {
      id: "complaints",
      heading: "Complaints",
      blocks: [
        {
          kind: "p",
          text: `If you think we have handled your data unlawfully, please tell us first at ${entity.privacyEmail}. You can also complain to the Croatian supervisory authority, ${supervisor.name}, ${supervisor.address} (${supervisor.site}), or to the authority in the EU country where you live or work.`,
        },
      ],
    },
    {
      id: "security",
      heading: "Security",
      blocks: [
        {
          kind: "p",
          text: "Passwords are stored as salted hashes, never in a readable form. Sessions use short-lived access tokens with rotating refresh tokens and automatic revocation of a whole session family if a token is reused, which limits the damage a stolen token can do. Requests are rate-limited, and access to production data is restricted to those who need it.",
        },
        {
          kind: "p",
          text: "No service can promise perfect security. Use a password you do not use anywhere else, and tell us if you think your account has been compromised. If a breach occurs that is likely to put your rights at risk, we will notify the supervisory authority and, where required, you.",
        },
      ],
    },
    {
      id: "children",
      heading: "Children",
      blocks: [
        {
          kind: "p",
          text: `The Service is not for anyone under 16, and we do not knowingly collect data from children. If you believe a child has created an account, write to ${entity.privacyEmail} and we will delete it.`,
        },
      ],
    },
    {
      id: "cookies",
      heading: "Cookies",
      blocks: [
        {
          kind: "p",
          text: "We set one cookie to remember the language you chose, so that the site opens in it next time. It is strictly functional and does not track you across sites, which is why there is no cookie banner.",
        },
        {
          kind: "p",
          text: "The game client also uses your browser’s local storage to keep you signed in. If we later add analytics or advertising cookies, we will ask for your consent before setting them and this section will say so.",
        },
      ],
    },
    {
      id: "changes",
      heading: "Changes to this policy",
      blocks: [
        {
          kind: "p",
          text: "We will update this policy as the Service grows — when we add payments, analytics, or a new use of Game Data. The date at the top shows the current version.",
        },
        {
          kind: "p",
          text: "If a change materially affects how we use your personal data, we will give you notice by email or in the Service before it takes effect.",
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
            { label: "Controller", text: `${entity.name}, ${entity.address}` },
            { label: "OIB", text: entity.oib },
            { label: "Privacy and data requests", text: entity.privacyEmail },
            { label: "Support", text: entity.supportEmail },
            {
              label: "Supervisory authority",
              text: `${supervisor.name}, ${supervisor.address} — ${supervisor.site}`,
            },
          ],
        },
      ],
    },
  ],
} satisfies LegalDocument;

export default privacy;
