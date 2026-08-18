import { entity } from "./entity";
import type { LegalDocument } from "./types";

/**
 * Authoritative English Terms of Service.
 *
 * TODO(legal): obtain review by qualified Croatian and EU counsel before
 * publication, particularly for the licence, indemnity, payments, unilateral
 * modification, consumer withdrawal, and limitation-of-liability provisions.
 */
const terms = {
  title: "Terms of Service",
  updatedLabel: "Last updated",
  updated: "18 August 2026",
  lede: `These Terms of Service constitute a legally binding agreement between you and ${entity.name} concerning access to and use of ${entity.site}, its game clients, servers, features, content, and related services. By accessing or using the Service, you acknowledge that you have read, understood, and agreed to these Terms. If you do not agree, you must not access or use the Service.`,
  tocLabel: "Contents",
  sections: [
    {
      id: "operator-and-scope",
      heading: "Operator, scope, and incorporated terms",
      blocks: [
        {
          kind: "p",
          text: `${entity.site} and the associated services (collectively, the “Service”) are operated by ${entity.name}, ${entity.address}, OIB ${entity.oib}, registered at ${entity.registration} (“Operator”, “we”, “us”, or “our”). “You” means each person who accesses or uses the Service, whether through a registered account, a guest account, or otherwise.`,
        },
        {
          kind: "p",
          text: "These Terms govern all access to and use of the Service. Our Privacy Policy describes our processing of personal data and is incorporated into these Terms by reference. Additional rules, notices, purchase terms, event rules, or feature-specific conditions displayed through the Service form part of these Terms when applicable.",
        },
        {
          kind: "p",
          text: "If you access the Service on behalf of an organization, you represent and warrant that you have authority to bind that organization. In that case, “you” includes the organization.",
        },
      ],
    },
    {
      id: "eligibility",
      heading: "Eligibility and legal capacity",
      blocks: [
        {
          kind: "p",
          text: "You must be at least 16 years old and legally capable of entering into these Terms. You may not access or use the Service if applicable law prohibits you from doing so or if we previously suspended or terminated your access, unless we provide prior written authorization.",
        },
        {
          kind: "p",
          text: "You represent and warrant that all information supplied in connection with the Service is complete, current, and accurate. You must promptly update information that becomes inaccurate.",
        },
      ],
    },
    {
      id: "accounts",
      heading: "Accounts, credentials, and usernames",
      blocks: [
        {
          kind: "p",
          text: "You are responsible for maintaining the confidentiality and security of your credentials and for all activity conducted through your account. You must notify us without undue delay if you suspect unauthorized access, credential compromise, or other account misuse.",
        },
        {
          kind: "p",
          text: "Accounts are personal, revocable, non-transferable privileges. You may not sell, assign, share, lend, or otherwise permit another person to use your account. Except where we expressly permit otherwise, each person may maintain only one account.",
        },
        {
          kind: "p",
          text: "Usernames, account identifiers, ratings, rankings, statistics, and other account attributes do not constitute your property. We may reject, rename, reclaim, reserve, or disable any username or identifier, including for inactivity, impersonation, infringement, advertising, abuse, security, or operational reasons.",
        },
        {
          kind: "p",
          text: "Guest accounts are temporary and unranked. We may delete a guest account, its credentials, and its account progress at any time, including automatically after approximately 24 hours. Deleted guest progress cannot be recovered or transferred.",
        },
      ],
    },
    {
      id: "limited-access-right",
      heading: "Limited right to use the Service",
      blocks: [
        {
          kind: "p",
          text: "Subject to continuous compliance with these Terms, we grant you a limited, personal, non-exclusive, non-transferable, non-sublicensable, and revocable right to access and use the Service for its intended purpose. This right does not transfer any ownership or intellectual-property interest to you.",
        },
        {
          kind: "p",
          text: "We reserve all rights not expressly granted. We may impose or modify technical, geographic, account, feature, storage, communication, or usage limits where reasonably necessary for security, compliance, operations, product development, or protection of the Service and its users.",
        },
      ],
    },
    {
      id: "acceptable-use",
      heading: "Acceptable use and prohibited conduct",
      blocks: [
        {
          kind: "p",
          text: "You must use the Service lawfully, fairly, and in accordance with its intended operation. You must not:",
        },
        {
          kind: "list",
          items: [
            "collude, disclose private game information, prearrange results, manipulate outcomes, or obtain an unauthorized competitive advantage;",
            "use bots, solvers, scripts, automation, external assistance, or software that plays, advises, observes, or acts on your behalf without our prior written authorization;",
            "operate multiple accounts, share accounts, impersonate another person, evade enforcement, farm ratings, deliberately lose, or manipulate matchmaking, seasons, rankings, or leaderboards;",
            "harass, threaten, abuse, defame, discriminate against, exploit, solicit, spam, or disclose personal information about another person;",
            "submit, transmit, or display content that is unlawful, deceptive, obscene, hateful, infringing, malicious, or otherwise objectionable;",
            "scrape, crawl, index, harvest, monitor, extract, download in bulk, sell, or commercially exploit the Service or its data without our prior written authorization;",
            "copy, modify, translate, reverse engineer, decompile, disassemble, derive source code from, or create derivative works of any protected part of the Service, except where applicable law expressly permits it;",
            "circumvent or interfere with authentication, security controls, access restrictions, rate limits, technical measures, protocols, servers, networks, or another person’s use of the Service;",
            "introduce malware, probe vulnerabilities, obtain unauthorized access, or use the Service to develop, train, test, or operate a competing product or dataset;",
            "use the Service or its output in a manner that violates law, third-party rights, these Terms, or any additional rules displayed through the Service.",
          ],
        },
      ],
    },
    {
      id: "monitoring-and-enforcement",
      heading: "Monitoring, investigation, and enforcement",
      blocks: [
        {
          kind: "p",
          text: "To the extent permitted by law, we may monitor use of the Service, review communications and gameplay records, employ automated detection systems, investigate suspected misconduct, preserve evidence, and cooperate with rights holders, regulators, courts, and law-enforcement authorities. We have no obligation to monitor every activity or communication.",
        },
        {
          kind: "p",
          text: "If we reasonably suspect a violation, security risk, fraud, abuse, legal exposure, or threat to the integrity of the Service, we may take any proportionate action we consider necessary. Such action may include removing content, voiding games, withholding rewards, recalculating or resetting ratings, removing leaderboard entries, restricting features, suspending or terminating accounts, and blocking associated credentials, devices, identifiers, or network addresses.",
        },
        {
          kind: "p",
          text: `We may act without prior notice where notice is impracticable, prohibited, or likely to prejudice security, an investigation, another person, or the Service. You may request review by contacting ${entity.supportEmail}. We retain discretion over the outcome and may withhold confidential detection methods, security information, privileged material, and information concerning other persons.`,
        },
      ],
    },
    {
      id: "ranked-play",
      heading: "Ranked play, ratings, and public records",
      blocks: [
        {
          kind: "p",
          text: "Ratings, rankings, seasons, matchmaking criteria, statistics, rewards, and leaderboard positions are Service features with no monetary value or guaranteed duration. We may establish, modify, recalculate, reset, withhold, or discontinue them to protect integrity, correct errors, rebalance competition, respond to abuse, or develop the Service.",
        },
        {
          kind: "p",
          text: "Profiles, usernames, avatars, ratings, rankings, match histories, game records, statistics, and replays may be public by default. Anyone may view, reproduce, discuss, or index public information, including through search engines and third-party services. You must not submit information that you are unwilling or unauthorized to make public.",
        },
      ],
    },
    {
      id: "user-content",
      heading: "User Content and representations",
      blocks: [
        {
          kind: "p",
          text: "“User Content” means any content, information, communication, image, username, avatar, profile material, table name, chat message, feedback, suggestion, report, or other material that you submit, transmit, display, or otherwise make available in connection with the Service.",
        },
        {
          kind: "p",
          text: "You retain any ownership rights that you lawfully hold in User Content. You represent and warrant that you own or control all rights necessary to provide User Content and to grant the rights set out in these Terms, and that our permitted use will not violate law or third-party rights.",
        },
        {
          kind: "p",
          text: "You are solely responsible for User Content. We may refuse, edit, restrict, preserve, disclose, or remove User Content where reasonably necessary to operate or protect the Service, enforce these Terms, comply with law, or protect any person or right.",
        },
      ],
    },
    {
      id: "service-and-game-data",
      heading: "Service Data, Game Data, and operator rights",
      blocks: [
        {
          kind: "p",
          text: "“Game Data” means all information generated by, derived from, or associated with gameplay. It includes bids, contracts, cards, declarations, scoring, moves, outcomes, timings, disconnections, substitutions, table and seat configurations, ratings, rankings, replays, chat, matchmaking records, anti-abuse signals, and associated account, session, device, and technical identifiers.",
        },
        {
          kind: "p",
          text: "“Service Data” means Game Data and all operational, analytical, statistical, security, performance, ranking, matchmaking, telemetry, metadata, and derived information generated or maintained by or for the Service. As between you and us, we own all rights, title, and interest in Service Data and the databases, compilations, systems, and outputs containing it, to the fullest extent permitted by law. This provision does not eliminate your rights under data-protection law or your pre-existing intellectual-property rights in User Content.",
        },
        {
          kind: "p",
          text: "To the extent you hold any right in User Content, Game Data, or Service Data, you grant us a perpetual, irrevocable, worldwide, non-exclusive, royalty-free, fully paid-up, transferable, and sublicensable licence to host, store, cache, reproduce, record, collect, use, adapt, modify, translate, format, combine, analyse, infer from, aggregate, anonymize, create derivative works from, publish, display, perform, distribute, market, commercialize, license, sell, and otherwise exploit it in any media or technology now known or later developed, for any lawful purpose.",
        },
        {
          kind: "p",
          text: "The licence permits use without attribution, notice, approval, compensation, royalties, revenue sharing, or accounting to you. To the extent permitted by law, you waive and agree not to assert moral rights or equivalent rights. Rights relating to personal data remain subject to the Privacy Policy and applicable law.",
        },
      ],
    },
    {
      id: "ai-and-commercial-use",
      heading: "Artificial intelligence, research, and commercial exploitation",
      blocks: [
        {
          kind: "p",
          text: "Without limiting the preceding licence, we may use User Content, Game Data, and Service Data for the following purposes:",
        },
        {
          kind: "list",
          items: [
            "developing, training, fine-tuning, testing, evaluating, benchmarking, validating, and deploying artificial-intelligence and machine-learning systems, models, agents, and card-playing engines;",
            "creating, enriching, combining, publishing, distributing, licensing, or selling datasets, features, statistics, benchmarks, simulations, and derivative materials;",
            "conducting research, analytics, product development, personalization, moderation, fraud prevention, security, quality assurance, and commercial activities;",
            "making models, engines, datasets, outputs, replays, statistics, and derived materials available to customers, licensees, research partners, contractors, service providers, and other third parties;",
            "using public gameplay, rankings, profiles, replays, statistics, and excerpts from User Content in demonstrations, documentation, promotions, marketing, media, and public communications.",
          ],
        },
        {
          kind: "p",
          text: "These rights survive suspension, termination, closure, and deletion of an account. We are not required to retrain, rebuild, delete, withdraw, or cease using a model, engine, dataset, aggregate, statistic, benchmark, publication, or other derivative material that lawfully incorporated data before a later account closure or request, except where applicable law expressly requires otherwise.",
        },
      ],
    },
    {
      id: "intellectual-property",
      heading: "Intellectual property and feedback",
      blocks: [
        {
          kind: "p",
          text: "The Service, including its software, source and object code, interfaces, visual design, text, graphics, game presentation, databases, selection and arrangement of content, trademarks, logos, documentation, and underlying technology, is owned by or licensed to us and is protected by intellectual-property and other laws.",
        },
        {
          kind: "p",
          text: "If you provide an idea, suggestion, proposal, or other feedback, you assign to us all rights in that feedback to the extent permitted by law. Where assignment is ineffective, you grant the licence stated in the Service Data section. We may use feedback without restriction, attribution, confidentiality obligation, or compensation.",
        },
      ],
    },
    {
      id: "payments",
      heading: "Paid features, subscriptions, and virtual entitlements",
      blocks: [
        {
          kind: "p",
          text: "The Service is currently free. If we offer paid features, subscriptions, or virtual entitlements, the price, billing period, material functionality, and applicable taxes will be disclosed before purchase. A third-party payment provider may process payment credentials, and you authorize us and that provider to charge the selected payment method.",
        },
        {
          kind: "p",
          text: "A subscription renews automatically for successive periods unless cancelled before renewal. Cancellation takes effect at the end of the paid period. Fees are non-refundable except where these Terms, the purchase terms, or mandatory law require a refund. We may change future prices upon legally sufficient notice.",
        },
        {
          kind: "p",
          text: "Virtual items, cosmetics, access rights, ratings, rewards, and similar entitlements are limited contractual permissions to use features within the Service. They are not property, currency, stored value, or financial instruments. They have no cash value and may not be sold, transferred, exchanged, or redeemed except where we expressly permit it.",
        },
        {
          kind: "p",
          text: "Consumers in the European Union may have a statutory 14-day withdrawal right for distance contracts. Where permitted by law, you expressly request immediate performance and acknowledge that the withdrawal right may be lost after full performance of a service or after supply of digital content begins with your prior consent and acknowledgment. Mandatory remedies for non-conforming digital content or services remain unaffected.",
        },
      ],
    },
    {
      id: "third-party-services",
      heading: "Third-party services and content",
      blocks: [
        {
          kind: "p",
          text: "The Service may depend on or link to third-party services, networks, software, content, or payment systems. We do not control third parties and are not responsible for their availability, security, accuracy, conduct, terms, or data practices. Your use of third-party services is governed by the terms and policies of those third parties.",
        },
      ],
    },
    {
      id: "availability-and-changes",
      heading: "Availability, modifications, and discontinuation",
      blocks: [
        {
          kind: "p",
          text: "We may maintain, update, test, modify, replace, restrict, suspend, or discontinue any part of the Service for security, legal, commercial, technical, operational, or product-development reasons. This includes game modes, rules, artificial-intelligence opponents, ratings, rankings, seasons, replays, virtual entitlements, interfaces, eligibility criteria, and supported devices or regions.",
        },
        {
          kind: "p",
          text: "We do not guarantee uninterrupted availability, compatibility, latency, matchmaking, opponent behavior, preservation of data, ratings, or progress, or correction of every defect. We may impose maintenance windows, capacity restrictions, or emergency suspensions without liability, subject to mandatory law.",
        },
      ],
    },
    {
      id: "suspension-and-termination",
      heading: "Suspension, termination, and consequences",
      blocks: [
        {
          kind: "p",
          text: "You may stop using the Service and request account closure at any time. Closure does not entitle you to deletion of all records or derived materials where continued retention or use is permitted by these Terms, the Privacy Policy, or applicable law.",
        },
        {
          kind: "p",
          text: "We may restrict, suspend, or terminate access if we reasonably believe that you breached these Terms, created risk or legal exposure, threatened the Service or another person, engaged in fraud or abuse, remained inactive, failed to pay an amount due, or if continued access is no longer commercially, technically, or legally practicable. We will provide notice where required by law.",
        },
        {
          kind: "p",
          text: "Upon termination, your right to use the Service ends immediately. Provisions that by their nature should survive will remain effective, including provisions concerning ownership, licences, Service Data, artificial intelligence, payments owed, disclaimers, indemnification, liability, disputes, and general terms.",
        },
      ],
    },
    {
      id: "warranties",
      heading: "Disclaimers of warranties",
      blocks: [
        {
          kind: "p",
          text: "To the fullest extent permitted by law, the Service is provided “as is” and “as available”, with all faults and without warranties of any kind. We disclaim all express, implied, and statutory warranties, including warranties of merchantability, satisfactory quality, fitness for a particular purpose, title, non-infringement, accuracy, availability, security, and uninterrupted or error-free operation.",
        },
        {
          kind: "p",
          text: "We do not warrant that the Service, any opponent, output, recommendation, ranking, statistic, replay, or communication will be accurate, fair, complete, current, secure, or suitable for your purpose. Nothing in these Terms excludes a warranty or consumer guarantee that cannot lawfully be excluded.",
        },
      ],
    },
    {
      id: "indemnification",
      heading: "Indemnification",
      blocks: [
        {
          kind: "p",
          text: "To the fullest extent permitted by law, you will indemnify and hold harmless the Operator, its affiliates, and their respective officers, personnel, contractors, licensors, and service providers from claims, liabilities, losses, damages, judgments, penalties, costs, and reasonable legal fees arising from your unlawful conduct, material breach of these Terms, infringement of third-party rights, User Content, fraud, or misuse of the Service. This provision does not apply to the extent a claim results from our own breach, negligence, or unlawful conduct, and it does not limit mandatory consumer rights.",
        },
      ],
    },
    {
      id: "liability",
      heading: "Limitation of liability",
      blocks: [
        {
          kind: "p",
          text: "Nothing in these Terms limits liability for intentional misconduct, gross negligence, death or personal injury caused by negligence, fraud, or any other liability that applicable law prohibits us from limiting or excluding.",
        },
        {
          kind: "p",
          text: "Subject to the preceding sentence and to the fullest extent permitted by law, we are not liable for indirect, incidental, special, consequential, exemplary, or punitive damages, or for loss of profits, revenue, business, opportunity, goodwill, data, ratings, rankings, progress, or virtual entitlements. We are not liable for another user’s conduct, third-party services, unauthorized account access not caused by our breach, or events beyond our reasonable control.",
        },
        {
          kind: "p",
          text: "Subject to mandatory law, our aggregate liability arising out of or relating to the Service and these Terms will not exceed the greater of EUR 100 or the amount you paid directly to us for the Service during the 12 months preceding the event giving rise to liability. The limitations apply regardless of the legal theory and even if a remedy fails of its essential purpose.",
        },
      ],
    },
    {
      id: "changes-to-terms",
      heading: "Changes to these Terms",
      blocks: [
        {
          kind: "p",
          text: "We may amend these Terms to reflect changes in law, regulation, security requirements, technology, functionality, commercial arrangements, pricing, business operations, or the Service. The “Last updated” date identifies the current version.",
        },
        {
          kind: "p",
          text: "Where an amendment materially affects your rights or obligations, we will provide reasonable advance notice unless immediate effect is necessary for legal, regulatory, fraud-prevention, or security reasons. Continued use after the effective date constitutes acceptance where permitted by law. If you reject an amendment, your exclusive remedy is to stop using the Service and close your account, subject to mandatory rights.",
        },
      ],
    },
    {
      id: "law-and-disputes",
      heading: "Governing law and dispute resolution",
      blocks: [
        {
          kind: "p",
          text: "These Terms and all non-contractual obligations arising from them are governed by the laws of the Republic of Croatia, without regard to conflict-of-law rules. If you are a consumer, this choice does not deprive you of mandatory protections under the law of your country of habitual residence.",
        },
        {
          kind: "p",
          text: `Before commencing proceedings, you may submit a written complaint to ${entity.supportEmail} describing the dispute and requested resolution. This does not restrict your right to contact a competent consumer-protection authority, use an available alternative dispute-resolution entity, or bring proceedings where mandatory law permits.`,
        },
        {
          kind: "p",
          text: "Subject to mandatory consumer jurisdiction, the courts with territorial jurisdiction over our registered office have exclusive jurisdiction. A consumer resident in the European Union may bring proceedings in the courts of the consumer’s domicile, and we may bring proceedings against that consumer only in those courts where applicable law so requires.",
        },
      ],
    },
    {
      id: "general",
      heading: "General provisions",
      blocks: [
        {
          kind: "p",
          text: "These Terms and incorporated policies constitute the entire agreement concerning the Service and supersede prior understandings on that subject. If a provision is invalid or unenforceable, it will be enforced to the maximum lawful extent and the remaining provisions will remain effective.",
        },
        {
          kind: "p",
          text: "Our failure to enforce a provision is not a waiver. You may not assign or transfer these Terms or any account right without our prior written consent. We may assign or transfer these Terms, in whole or in part, to an affiliate, successor, purchaser, or other entity in connection with financing, restructuring, merger, acquisition, sale of assets, or operation of the Service, subject to applicable law.",
        },
        {
          kind: "p",
          text: "We are not liable for delay or failure caused by events beyond our reasonable control. Except where expressly stated, these Terms create no agency, partnership, employment, fiduciary, or third-party beneficiary relationship.",
        },
      ],
    },
    {
      id: "language",
      heading: "Language",
      blocks: [
        {
          kind: "p",
          text: "These Terms are issued exclusively in English. Any translation made available for convenience is non-authoritative, and the English text governs to the fullest extent permitted by applicable law.",
        },
      ],
    },
    {
      id: "contact",
      heading: "Operator and contact information",
      blocks: [
        {
          kind: "rows",
          rows: [
            { label: "Operator", text: `${entity.name}, ${entity.address}` },
            { label: "OIB", text: entity.oib },
            { label: "Registration", text: entity.registration },
            { label: "Support and legal notices", text: entity.supportEmail },
            { label: "Privacy and data requests", text: entity.privacyEmail },
          ],
        },
      ],
    },
  ],
} satisfies LegalDocument;

export default terms;
