import { entity, supervisor } from "./entity";
import type { LegalDocument } from "./types";

/**
 * Authoritative English Privacy Policy.
 *
 * TODO(legal): validate every described data flow, recipient category, lawful
 * basis, retention criterion, and international transfer before publication,
 * then obtain review by qualified Croatian and EU privacy counsel.
 */
const privacy = {
    title: "Privacy Policy",
    updatedLabel: "Last updated",
    updated: "18 August 2026",
    lede: `This Privacy Policy describes how ${entity.name} collects, uses, discloses, retains, and otherwise processes personal data in connection with ${entity.site} and the Service. It also describes our use of data for analytics, artificial intelligence, research, dataset development, licensing, and other commercial purposes, together with the rights available under applicable data-protection law.`,
    tocLabel: "Contents",
    sections: [
        {
            id: "controller-and-scope",
            heading: "Controller, scope, and interpretation",
            blocks: [
                {
                    kind: "p",
                    text: `${entity.name}, ${entity.address}, OIB ${entity.oib}, is the controller of personal data processed under this Policy. Questions and data-subject requests may be submitted to ${entity.privacyEmail}.`,
                },
                {
                    kind: "p",
                    text: "This Policy applies to the website, game clients, servers, communications, support channels, and related features that comprise the Service. It does not apply to third-party services governed by their own privacy notices.",
                },
                {
                    kind: "p",
                    text: "“Personal data”, “processing”, “controller”, and “processor” have the meanings assigned by the General Data Protection Regulation (EU) 2016/679 (“GDPR”). Capitalized terms not defined in this Policy have the meanings assigned in the Terms of Service. This Policy is a transparency notice and does not limit processing otherwise permitted by applicable law.",
                },
            ],
        },
        {
            id: "data-categories",
            heading: "Categories of personal data",
            blocks: [
                {
                    kind: "p",
                    text: "Depending on how you use the Service and which features are available, we may process the following categories of personal data:",
                },
                {
                    kind: "rows",
                    rows: [
                        {
                            label: "Account and profile data",
                            text: "Username, email address, password hash, avatar, profile information, account type, roles, preferences, settings, account status, identifiers, creation and modification dates, and sign-in history.",
                        },
                        {
                            label: "Authentication and security data",
                            text: "Session and token records, Internet Protocol addresses, user-agent strings, device and browser identifiers, authentication events, rate-limit records, abuse reports, fraud indicators, enforcement history, and security logs.",
                        },
                        {
                            label: "Game Data",
                            text: "Bids, contracts, cards, declarations, scoring, moves, outcomes, timings, disconnections, substitutions, table and seat configurations, ratings, rankings, replays, chat, matchmaking records, and identifiers connecting gameplay to accounts, sessions, devices, or other participants.",
                        },
                        {
                            label: "Usage and technical data",
                            text: "Pages, screens, features, links, and controls used; timestamps and session duration; referral and navigation information; crash, performance, diagnostic, and request logs; device, operating-system, browser, language, network, and approximate location information derived from an Internet Protocol address.",
                        },
                        {
                            label: "Public and social data",
                            text: "Public usernames, avatars, profiles, ratings, rankings, match histories, replays, statistics, table information, and content or interactions visible to other participants or the public.",
                        },
                        {
                            label: "Communications and User Content",
                            text: "Chat messages, support correspondence, appeals, complaints, feedback, survey responses, bug reports, attachments, and other content submitted through or concerning the Service.",
                        },
                        {
                            label: "Transaction data",
                            text: "If paid features are offered, purchase, subscription, invoice, tax, country, amount, currency, status, refund, and payment-provider references. The payment provider, rather than us, processes complete payment-card credentials unless otherwise disclosed.",
                        },
                        {
                            label: "Derived and inferred data",
                            text: "Statistics, classifications, preferences, skill estimates, risk scores, anti-cheat signals, behavioral patterns, model features, predictions, segments, aggregates, and other information inferred or derived from the categories above.",
                        },
                    ],
                },
            ],
        },
        {
            id: "data-sources",
            heading: "Sources of personal data",
            blocks: [
                {
                    kind: "p",
                    text: "We collect personal data directly from you, automatically from your device and use of the Service, from other users who interact with or report you, and from service providers that support authentication, hosting, email, payments, analytics, security, or customer support. We may also generate personal data through observations, calculations, inferences, analytics, moderation, and artificial-intelligence or machine-learning systems.",
                },
                {
                    kind: "p",
                    text: "Where permitted by law and relevant to the Service, we may obtain information from public sources, rights holders, fraud-prevention services, research partners, commercial partners, corporate affiliates, or a business transferred to us. Any materially different source will be disclosed where required.",
                },
            ],
        },
        {
            id: "guest-play",
            heading: "Guest accounts and temporary access",
            blocks: [
                {
                    kind: "p",
                    text: "A guest account does not require a user-supplied email address or password. Guest credentials and active session records are ordinarily deleted automatically within approximately 24 hours, but deletion may occur sooner or later for technical, security, legal, or operational reasons.",
                },
                {
                    kind: "p",
                    text: "Game Data, security records, public records, aggregates, models, and derived information associated with guest use may be retained and used under the same criteria that apply to registered use. Guest-account deletion does not require deletion of those records where continued processing is lawful.",
                },
            ],
        },
        {
            id: "purposes-and-bases",
            heading: "Purposes and lawful bases for processing",
            blocks: [
                {
                    kind: "p",
                    text: "We process personal data for the purposes and on the lawful bases described below. More than one lawful basis may apply to the same processing activity.",
                },
                {
                    kind: "rows",
                    rows: [
                        {
                            label: "Service performance, Article 6(1)(b) GDPR",
                            text: "Creating and administering accounts; authenticating access; operating games, matchmaking, ratings, rankings, profiles, replays, settings, and support; processing purchases; and performing the Terms of Service.",
                        },
                        {
                            label: "Security and integrity, Article 6(1)(f) GDPR",
                            text: "Protecting users, accounts, systems, data, and rights; detecting bots, collusion, account sharing, fraud, abuse, manipulation, and security incidents; enforcing rules; preserving evidence; and preventing ban evasion. Our legitimate interests are maintaining a secure, lawful, reliable, and commercially viable Service.",
                        },
                        {
                            label: "Development and personalization, Article 6(1)(f) GDPR",
                            text: "Analysing use, diagnosing faults, measuring performance, personalizing experiences, testing features, conducting surveys, developing products, forecasting demand, and improving gameplay, matchmaking, artificial-intelligence opponents, moderation, and operations. Our legitimate interests are understanding, developing, and optimizing the Service and related products.",
                        },
                        {
                            label: "AI, research, and commercialization, Article 6(1)(f) GDPR",
                            text: "Developing, training, fine-tuning, evaluating, validating, benchmarking, deploying, licensing, and commercializing models, engines, datasets, statistics, features, and derived materials. Our legitimate interests are research, innovation, intellectual-property development, and lawful commercial exploitation of Service-generated data and technology.",
                        },
                        {
                            label: "Communications and marketing, Articles 6(1)(a) and 6(1)(f) GDPR",
                            text: "Sending transactional notices, responding to requests, measuring communications, promoting features or offers, and conducting customer research. We rely on consent where electronic-marketing or cookie law requires it and on legitimate interests where direct marketing is otherwise permitted.",
                        },
                        {
                            label: "Legal compliance and claims, Articles 6(1)(c) and 6(1)(f) GDPR",
                            text: "Complying with tax, accounting, consumer, regulatory, court, law-enforcement, and other legal obligations; responding to lawful requests; establishing, exercising, or defending legal claims; and managing corporate transactions.",
                        },
                        {
                            label: "Consent, Article 6(1)(a) GDPR",
                            text: "Processing that we specifically describe when requesting consent, including non-essential cookies, certain marketing, or a new use for which another lawful basis is unavailable. You may withdraw consent prospectively at any time.",
                        },
                        {
                            label: "Vital interests, Article 6(1)(d) GDPR",
                            text: "Processing necessary in exceptional circumstances to protect a person’s life or physical safety.",
                        },
                    ],
                },
            ],
        },
        {
            id: "ai-and-commercial-use",
            heading: "Artificial intelligence, datasets, and commercial use",
            blocks: [
                {
                    kind: "p",
                    text: "We may use Game Data, Usage Data, User Content, public information, account-linked information, and derived or inferred data to develop and commercialize artificial-intelligence and machine-learning systems. Activities may include training, fine-tuning, retrieval, evaluation, benchmarking, safety testing, deployment, model improvement, feature extraction, simulation, and creation of card-playing engines or other systems.",
                },
                {
                    kind: "p",
                    text: "We may combine data across users, accounts, sessions, devices, Service features, and lawful external sources. We may create, publish, share, license, sell, or otherwise make available models, engines, datasets, benchmarks, statistics, aggregates, and derivative materials to research, technology, commercial, or other partners.",
                },
                {
                    kind: "p",
                    text: "Where permitted by law and supported by an applicable lawful basis, commercial use or disclosure may include personal data and account-linked data. We will use contractual, technical, organizational, pseudonymization, anonymization, notice, and consent measures where required by the nature of the processing and applicable law. Direct credentials and complete payment-card details are not licensed as dataset content.",
                },
                {
                    kind: "p",
                    text: "Deleting an account or objecting to future processing does not automatically remove data from a model, engine, dataset, aggregate, statistic, publication, backup, or derivative material created lawfully before the request. We will take measures required by applicable law, but we are not required to reverse processing or rebuild derived materials where the relevant data is no longer personal, cannot reasonably be isolated, or may lawfully be retained.",
                },
            ],
        },
        {
            id: "public-information",
            heading: "Public information and participant communications",
            blocks: [
                {
                    kind: "p",
                    text: "Usernames, avatars, profiles, ratings, rankings, match histories, replays, gameplay, statistics, and other designated features may be public by default. Public information may be viewed, copied, indexed, archived, discussed, republished, or otherwise processed by third parties over whom we have no control.",
                },
                {
                    kind: "p",
                    text: "In-game chat and table communications are visible to the intended participants and may be retained with game, moderation, or security records. You must not submit personal data that you lack authority to disclose or information that you do not want recipients to retain.",
                },
            ],
        },
        {
            id: "disclosures",
            heading: "Recipients and disclosures",
            blocks: [
                {
                    kind: "p",
                    text: "Subject to applicable law, we may disclose personal data to the following recipient categories:",
                },
                {
                    kind: "list",
                    items: [
                        "hosting, database, cache, content-delivery, authentication, security, fraud-prevention, communications, customer-support, analytics, development, storage, and professional-service providers;",
                        "payment processors, banks, billing providers, tax providers, and transaction counterparties when paid features are offered;",
                        "researchers, dataset recipients, model developers, technology providers, licensors, licensees, commercial partners, customers, and contractors involved in the activities described in this Policy;",
                        "affiliates and entities under common control for administration, security, research, product development, financing, and other lawful business purposes;",
                        "other users and the public when information forms part of a public or participant-facing Service feature or when you direct us to disclose it;",
                        "courts, regulators, law-enforcement authorities, government bodies, rights holders, advisers, insurers, auditors, and other parties where disclosure is legally required or reasonably necessary to protect rights, safety, security, or legal interests;",
                        "prospective or actual investors, lenders, purchasers, successors, or transaction participants in connection with due diligence, financing, reorganization, merger, acquisition, insolvency, or transfer of the business, Service, rights, or assets.",
                    ],
                },
                {
                    kind: "p",
                    text: "Recipients may act as processors, independent controllers, or joint controllers depending on the processing. Where required, we use data-processing agreements, confidentiality obligations, use restrictions, security requirements, and other safeguards.",
                },
            ],
        },
        {
            id: "international-transfers",
            heading: "International data transfers",
            blocks: [
                {
                    kind: "p",
                    text: "Recipients may process personal data in countries outside the European Economic Area (“EEA”) that provide different levels of data protection. Where Chapter V GDPR applies, we will use an available transfer mechanism, including an adequacy decision, approved standard contractual clauses, or another lawful derogation or safeguard.",
                },
                {
                    kind: "p",
                    text: `Where required, we assess transfer risks and implement supplementary technical, contractual, or organizational measures. You may request information about safeguards relevant to your personal data by contacting ${entity.privacyEmail}.`,
                },
            ],
        },
        {
            id: "retention",
            heading: "Retention and deletion criteria",
            blocks: [
                {
                    kind: "p",
                    text: "We retain personal data for as long as reasonably necessary for the purposes described in this Policy, including to provide the Service, maintain security and integrity, conduct research and development, commercialize lawful data products, comply with law, resolve disputes, preserve evidence, enforce agreements, and support corporate records. Retention depends on the data’s nature, sensitivity, purpose, legal basis, risk, operational value, and applicable limitation or recordkeeping periods.",
                },
                {
                    kind: "rows",
                    rows: [
                        {
                            label: "Account and profile data",
                            text: "Retained while the account is active and afterwards for closure, security, ban-evasion prevention, legal compliance, dispute resolution, and claims. Data no longer requiring an account link may be deidentified or separated from direct identifiers.",
                        },
                        {
                            label: "Session and technical data",
                            text: "Active token records ordinarily expire within 30 days for registered accounts and within approximately 24 hours for guests. Security, request, diagnostic, device, network, and enforcement records may be retained longer where needed for integrity, incident response, claims, or legal compliance.",
                        },
                        {
                            label: "Game Data and public records",
                            text: "May be retained for the life of the Service and afterwards where necessary for integrity, historical records, research, analytics, artificial intelligence, licensing, claims, or other lawful purposes. We may remove direct account links when they are no longer required.",
                        },
                        {
                            label: "Models and derived materials",
                            text: "Models, engines, aggregates, benchmarks, statistics, anonymized data, and other derived materials may be retained indefinitely where they no longer constitute personal data or where continued processing has a lawful basis.",
                        },
                        {
                            label: "Transactions and legal records",
                            text: "Retained for applicable tax, accounting, consumer, anti-fraud, limitation, and regulatory periods. Croatian accounting and tax requirements may require retention for 11 years.",
                        },
                        {
                            label: "Communications and claims",
                            text: "Retained while a matter is active and afterwards for quality assurance, institutional records, security, enforcement, limitation periods, legal obligations, and actual or anticipated claims.",
                        },
                    ],
                },
                {
                    kind: "p",
                    text: "Deletion from active systems may not immediately remove copies from backups, archives, disaster-recovery systems, recipients, public archives, or derived materials. Such copies may remain isolated until overwritten or deleted under the applicable retention cycle, unless law requires earlier action.",
                },
            ],
        },
        {
            id: "automated-processing",
            heading: "Automated processing and decision support",
            blocks: [
                {
                    kind: "p",
                    text: "We may use rules, statistical methods, artificial intelligence, and machine learning to support matchmaking, ratings, personalization, moderation, security, fraud prevention, abuse detection, enforcement, and product development. Inputs may include gameplay, account, device, network, communication, usage, and derived data.",
                },
                {
                    kind: "p",
                    text: "We do not currently make decisions producing legal or similarly significant effects solely through automated processing. Automated signals may trigger temporary restrictions or refer an account for enforcement. Where Article 22 GDPR applies, we will provide legally required information, safeguards, and a means to request human intervention or contest the decision.",
                },
            ],
        },
        {
            id: "data-rights",
            heading: "Data-subject rights",
            blocks: [
                {
                    kind: "p",
                    text: "Subject to the conditions, limitations, and exemptions in applicable law, you may exercise the following rights:",
                },
                {
                    kind: "list",
                    items: [
                        "access personal data and obtain information about its processing under Article 15 GDPR;",
                        "correct inaccurate or incomplete personal data under Article 16 GDPR;",
                        "request erasure under Article 17 GDPR;",
                        "request restriction of processing under Article 18 GDPR;",
                        "receive eligible data in a structured, commonly used, machine-readable format and transmit it to another controller under Article 20 GDPR;",
                        "object under Article 21 GDPR to processing based on legitimate interests, including profiling, research, artificial-intelligence development, commercialization, or direct marketing;",
                        "withdraw consent prospectively at any time under Article 7 GDPR;",
                        "obtain safeguards relating to applicable automated decisions under Article 22 GDPR;",
                        "lodge a complaint with a competent supervisory authority under Article 77 GDPR.",
                    ],
                },
                {
                    kind: "p",
                    text: `Submit a request to ${entity.privacyEmail}. We may require information reasonably necessary to verify identity, authority, account ownership, and request scope. We will respond within the period required by law and may extend that period, refuse a manifestly unfounded or excessive request, or charge a lawful fee where the GDPR permits.`,
                },
                {
                    kind: "p",
                    text: "Rights are not absolute. We may retain or continue processing data where necessary for contractual performance, legal obligations, freedom of expression and information, security, fraud prevention, public interest, research safeguards, legal claims, compelling legitimate grounds, or another lawful exception. An objection does not invalidate processing completed before the objection.",
                },
            ],
        },
        {
            id: "complaints",
            heading: "Supervisory authority and complaints",
            blocks: [
                {
                    kind: "p",
                    text: `You may lodge a complaint with ${supervisor.name}, ${supervisor.address} (${supervisor.site}), or with the competent supervisory authority in the European Union member state of your habitual residence, place of work, or alleged infringement. Contacting us first at ${entity.privacyEmail} may allow us to address the matter, but it is not a prerequisite to exercising that right.`,
                },
            ],
        },
        {
            id: "security",
            heading: "Information security",
            blocks: [
                {
                    kind: "p",
                    text: "We use technical and organizational measures designed to provide a level of security appropriate to the processing risk. Measures may include access controls, password hashing, token controls, rate limiting, logging, monitoring, segmentation, backups, testing, incident response, and restrictions on production access.",
                },
                {
                    kind: "p",
                    text: "No transmission, system, or storage method is completely secure. We do not warrant absolute security, and you are responsible for protecting credentials and devices. Where a personal-data breach triggers a legal notification obligation, we will notify the supervisory authority and affected persons as required by applicable law.",
                },
            ],
        },
        {
            id: "children",
            heading: "Children and age restrictions",
            blocks: [
                {
                    kind: "p",
                    text: `The Service is not directed to persons under 16, and such persons may not create an account or use guest play. We do not knowingly collect personal data from a person under 16. Reports concerning an underage account may be submitted to ${entity.privacyEmail}; we may investigate, restrict, and delete the account and associated data as appropriate.`,
                },
            ],
        },
        {
            id: "cookies-and-storage",
            heading: "Cookies, local storage, and similar technologies",
            blocks: [
                {
                    kind: "p",
                    text: "The Service uses a functional cookie to remember the selected language and uses browser storage and session cookies to authenticate accounts, maintain sessions, protect security, and preserve settings. These technologies are necessary for requested functionality and are not used for cross-site advertising under the current implementation.",
                },
                {
                    kind: "p",
                    text: "We may introduce analytics, personalization, advertising, or similar technologies in the future. Where consent is legally required, we will request it before placing or accessing the relevant technology and will provide a method to withdraw consent.",
                },
            ],
        },
        {
            id: "third-parties",
            heading: "Third-party services",
            blocks: [
                {
                    kind: "p",
                    text: "Links, integrations, payment systems, and other third-party services may collect personal data independently. Their processing is governed by their own notices and terms. We are not responsible for a third party’s privacy, security, or compliance practices except to the extent applicable law assigns responsibility to us.",
                },
            ],
        },
        {
            id: "policy-changes",
            heading: "Changes to this Policy",
            blocks: [
                {
                    kind: "p",
                    text: "We may amend this Policy to reflect changes in the Service, technology, data practices, commercial arrangements, recipients, security measures, or legal requirements. The “Last updated” date identifies the current version.",
                },
                {
                    kind: "p",
                    text: "Where required by law, we will provide notice before a material change takes effect and obtain consent for a new purpose that requires consent. Continued use does not constitute consent where applicable law requires an affirmative choice.",
                },
            ],
        },
        {
            id: "language",
            heading: "Language",
            blocks: [
                {
                    kind: "p",
                    text: "This Policy is issued exclusively in English. Any translation made available for convenience is non-authoritative, subject to mandatory transparency requirements under applicable law.",
                },
            ],
        },
        {
            id: "contact",
            heading: "Controller and contact information",
            blocks: [
                {
                    kind: "rows",
                    rows: [
                        {
                            label: "Controller",
                            text: `${entity.name}, ${entity.address}`,
                        },
                        { label: "OIB", text: entity.oib },
                        { label: "Registration", text: entity.registration },
                        {
                            label: "Privacy and data requests",
                            text: entity.privacyEmail,
                        },
                        { label: "Support", text: entity.supportEmail },
                        {
                            label: "Supervisory authority",
                            text: `${supervisor.name}, ${supervisor.address}, ${supervisor.site}`,
                        },
                    ],
                },
            ],
        },
    ],
} satisfies LegalDocument;

export default privacy;
