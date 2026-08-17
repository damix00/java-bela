import { entity, supervisor } from "./entity";
import type { LegalDocument } from "./types";

/**
 * Croatian version of the Privacy Policy. Section ids match `privacy.en.ts`
 * exactly so anchors survive a language switch.
 */
const privacy = {
  title: "Pravila privatnosti",
  updatedLabel: "Zadnja izmjena",
  updated: "17. kolovoza 2026.",
  lede: `Ova pravila objašnjavaju koje osobne podatke ${entity.name} prikuplja kada koristite ${entity.site}, zašto ih koristimo i što od nas možete zatražiti. Najvažniji je dio o umjetnoj inteligenciji i istraživanju: podatke koje stvara vaša igra koristimo za treniranje modela i želimo to reći otvoreno, a ne sakriti u sitni tisak.`,
  tocLabel: "Sadržaj",
  sections: [
    {
      id: "controller",
      heading: "Tko je odgovoran za vaše podatke",
      blocks: [
        {
          kind: "p",
          text: `Voditelj obrade je ${entity.name}, ${entity.address}, OIB ${entity.oib}. Za sve što se tiče vaših osobnih podataka, uključujući zahtjeve opisane niže, pišite na ${entity.privacyEmail}.`,
        },
        {
          kind: "p",
          text: "Ova pravila pokrivaju web stranicu, klijente igre i poslužitelje koji stoje za njima. Ne pokrivaju druge stranice na koje vodimo linkovima.",
        },
      ],
    },
    {
      id: "what-we-collect",
      heading: "Što prikupljamo",
      blocks: [
        {
          kind: "rows",
          rows: [
            {
              label: "Podaci o računu",
              text: "Korisničko ime, adresa e-pošte, kriptografski sažetak lozinke (nikada sama lozinka), avatar, vrsta računa, uloga te datumi otvaranja računa, zadnje izmjene i zadnje prijave.",
            },
            {
              label: "Podaci o sesiji i tehnički podaci",
              text: "Za svaku prijavljenu sesiju čuvamo IP adresu i identifikaciju preglednika ili uređaja (user-agent) uz zapise o tokenima te sesije, a radi ograničavanja zloupotreba držimo kratkotrajne brojače zahtjeva vezane na IP adrese. Naši poslužitelji vode i uobičajene zapise o zahtjevima i greškama.",
            },
            {
              label: "Podaci o igri",
              text: "Sve što stvara vaša igra: zvanja i ugovore, podijeljene i odigrane karte, deklaracije i bodovanje, ishode dijeljenja i partija, vremena i vrijeme razmišljanja, prekide veze i zamjene umjetnom inteligencijom, postavu stola i mjesta, rejtinge i njihove promjene, snimke partija, chat u igri i zapise o spajanju igrača — zajedno s identifikatorima koji sve to povezuju s vašim računom i sesijom.",
            },
            {
              label: "Kolačići i lokalna pohrana",
              text: "Jedan funkcionalni kolačić koji pamti odabrani jezik te lokalna pohrana koju klijent koristi kako biste ostali prijavljeni. Ako dodamo analitičke ili reklamne kolačiće, prvo ćemo vas pitati za privolu.",
            },
            {
              label: "Podaci o plaćanju",
              text: "Kada ponudimo plaćene funkcije, podatke o vašem plaćanju obrađuje pružatelj platnih usluga, a nama daje zapis o transakciji — iznos, datum, status i državu potrebnu za PDV. Cjelovit broj kartice ne primamo niti čuvamo.",
            },
            {
              label: "Prepiska",
              text: "Sadržaj e-pošte s podrškom, prijava grešaka, žalbi i svega drugoga što nam odlučite poslati.",
            },
          ],
        },
        {
          kind: "p",
          text: "Većinu toga prikupljamo od vas neposredno ili automatski dok igrate. Osobne podatke o vama ne kupujemo i trenutačno ne koristimo oglašivače trećih strana ni prijavu putem društvenih mreža.",
        },
      ],
    },
    {
      id: "guest-accounts",
      heading: "Igra kao gost",
      blocks: [
        {
          kind: "p",
          text: "Možete igrati bez registracije. Gostujući račun nema adresu e-pošte ni lozinku koju ste odabrali i briše se automatski — u pravilu unutar 24 sata — zajedno sa zapisima o sesiji. Gostujuća igra ne ulazi u rangiranje i njezin napredak se ne čuva.",
        },
        {
          kind: "p",
          text: "Podaci o igri nastali tijekom gostujuće igre čuvaju se kako je opisano u dijelu o rokovima čuvanja, na istoj osnovi kao i svi drugi Podaci o igri.",
        },
      ],
    },
    {
      id: "why-we-use-it",
      heading: "Zašto ih koristimo i na kojoj pravnoj osnovi",
      blocks: [
        {
          kind: "rows",
          rows: [
            {
              label: "Pružanje Usluge — čl. 6. st. 1. t. (b), ugovor",
              text: "Otvaranje i vođenje računa, prijava, spajanje igrača, vođenje partija, rejtinzi i ljestvice, čuvanje snimaka partija i korisnička podrška.",
            },
            {
              label:
                "Sigurnost i fer igra — čl. 6. st. 1. t. (f), legitimni interes",
              text: "Otkrivanje dogovaranja, botova, više računa i namještanja rejtinga; ograničavanje broja zahtjeva; obrada prijava zloupotrebe; zaštita računa i infrastrukture. Naš je interes igra koju se isplati igrati i usluga koja ostaje dostupna.",
            },
            {
              label:
                "Razvoj proizvoda, istraživanje i treniranje umjetne inteligencije — čl. 6. st. 1. t. (f), legitimni interes",
              text: "Analiza Podataka o igri radi poboljšanja Usluge, izrade statistika te izgradnje, treniranja, evaluacije i primjene modela umjetne inteligencije i strojnog učenja, uključujući programe koji igraju karte i modele koje možemo staviti na raspolaganje ili licencirati drugima. Vidi sljedeći dio.",
            },
            {
              label: "Plaćanja i računovodstvo — čl. 6. st. 1. t. (b) i (c)",
              text: "Naplata kada nešto kupite te vođenje računa i evidencija koje od nas zahtijeva hrvatsko porezno pravo.",
            },
            {
              label: "Zakonske obveze i zahtjevi — čl. 6. st. 1. t. (c) i (f)",
              text: "Postupanje po zakonitim zahtjevima nadležnih tijela te postavljanje, ostvarivanje i obrana pravnih zahtjeva.",
            },
            {
              label: "Marketinška e-pošta — čl. 6. st. 1. t. (a), privola",
              text: "Ako šaljemo novosti ili ponude e-poštom, činimo to samo s vašom privolom, a svaka poruka sadrži odjavu u jednom kliku. Povlačenje privole ne utječe na ono što smo poslali prije toga.",
            },
          ],
        },
      ],
    },
    {
      id: "ai-training",
      heading: "Umjetna inteligencija, istraživanje i skupovi podataka",
      blocks: [
        {
          kind: "p",
          text: "Podatke o igri koristimo kako bismo gradili nove stvari i namjeravamo to nastaviti. Konkretno, možemo:",
        },
        {
          kind: "list",
          items: [
            "trenirati, dodatno prilagođavati, evaluirati i mjeriti modele strojnog učenja i programe koji igraju karte na vašim partijama — uključujući protivnike s umjetnom inteligencijom unutar Usluge i modele koje koristimo komercijalno ili stavljamo na raspolaganje drugima;",
            "spajati vaše Podatke o igri s podacima drugih igrača i s podacima iz drugih izvora te iz njih izvoditi statistike, agregate i obilježja;",
            "sastavljati skupove podataka iz Podataka o igri te ih objavljivati, dijeliti, licencirati ili prodavati, među ostalim istraživačima i trećim osobama koje će na njima trenirati svoje modele;",
            "dijeliti Podatke o igri s izvođačima, istraživačkim partnerima i pružateljima usluga koji nam u svemu navedenome pomažu;",
            "nastaviti koristiti modele, skupove podataka, agregate i statistike već izvedene iz vaših Podataka o igri i nakon zatvaranja vašeg računa.",
          ],
        },
        {
          kind: "p",
          text: "To činimo na osnovi svojeg legitimnog interesa. Taj smo interes odvagnuli prema vašim pravima: Podaci o igri zapis su poteza u kartaškoj igri, a ne osjetljivi podaci, koristimo ih u agregiranom ili pseudonimiziranom obliku kad god to služi svrsi, a iz objavljenih ili licenciranih skupova podataka uklanjaju se neposredni identifikatori kao što je vaša adresa e-pošte. Vaše korisničko ime može ostati uz podatke o javnoj igri — snimke partija i ljestvice javne su funkcije Usluge.",
        },
        {
          kind: "p",
          text: `Budući da se ta obrada temelji na legitimnom interesu, imate pravo na prigovor prema čl. 21. GDPR-a. Pišite na ${entity.privacyEmail}. Prestat ćemo, osim ako ne dokažemo uvjerljive legitimne razloge koji nadilaze vaš prigovor, i u svakom slučaju ćemo vas obavijestiti. Prigovor ne uklanja vaše Podatke o igri iz modela koji su već trenirani — to nije moguće poništiti — i ne zaustavlja obradu koja nam je potrebna da bismo igru pokretali i održali je fer.`,
        },
        {
          kind: "p",
          text: "O vama ne donosimo odluke s pravnim ili slično značajnim učinkom isključivo automatiziranim putem. Automatizirani signali za otkrivanje varanja mogu ograničiti račun, a vi od nas možete zatražiti da tu odluku razmotrimo ponovno.",
        },
      ],
    },
    {
      id: "public-information",
      heading: "Što je javno",
      blocks: [
        {
          kind: "p",
          text: "Vaše korisničko ime, avatar, rejting, mjesto na ljestvici, povijest partija i snimke vaših partija javni su po zadanome. Mogu ih vidjeti svi na internetu, uključujući osobe bez računa, a pretraživači ih mogu indeksirati.",
        },
        {
          kind: "p",
          text: "Korisničko ime odaberite u skladu s tim: ako je to vaše pravo ime, onda je taj odabir odluka da objavite svoje pravo ime. Chat u igri vidljiv je ostalim igračima za vašim stolom i čuva se uz snimku partije.",
        },
      ],
    },
    {
      id: "sharing",
      heading: "S kim dijelimo podatke",
      blocks: [
        {
          kind: "list",
          items: [
            "pružateljima infrastrukture koji drže naše poslužitelje, baze podataka i priručne memorije, a podatke obrađuju po našim uputama i na temelju ugovora o obradi;",
            "pružatelju usluge dostave e-pošte, kada šaljemo poruke o računu, primjerice za promjenu lozinke;",
            "pružatelju platnih usluga, kada ponudimo plaćene funkcije;",
            "pružateljima analitike, kada koristimo analitiku;",
            "istraživačkim partnerima, izvođačima i trećim osobama, kako je opisano u dijelu o umjetnoj inteligenciji, istraživanju i skupovima podataka;",
            "sudovima, regulatorima i tijelima za provedbu zakona, kada smo na to zakonom obvezani ili kada je to potrebno za postavljanje ili obranu pravnih zahtjeva;",
            "kupcu ili pravnom sljedniku, ako se naše poslovanje ili njegova imovina prodaje, spaja ili reorganizira — uključujući Podatke o igri i modele izgrađene iz njih.",
          ],
        },
        {
          kind: "p",
          text: "Podatke o vašem računu — adresu e-pošte, lozinku, prepisku — ne prodajemo nikome. Podaci o igri su druga stvar, a dio o umjetnoj inteligenciji, istraživanju i skupovima podataka govori točno što s njima možemo činiti.",
        },
      ],
    },
    {
      id: "transfers",
      heading: "Prijenosi izvan EGP-a",
      blocks: [
        {
          kind: "p",
          text: "Podatke želimo držati u Europskom gospodarskom prostoru. Kada ih pružatelj ili partner obrađuje izvan njega, oslanjamo se na odluku Europske komisije o primjerenosti ili na standardne ugovorne klauzule Komisije, uz dodatne zaštitne mjere koje prijenos zahtijeva.",
        },
        {
          kind: "p",
          text: `Podatke o prijenosima koji se odnose na vas možete zatražiti na ${entity.privacyEmail}.`,
        },
      ],
    },
    {
      id: "retention",
      heading: "Koliko dugo ih čuvamo",
      blocks: [
        {
          kind: "rows",
          rows: [
            {
              label: "Gostujući računi",
              text: "Brišu se automatski, u pravilu unutar 24 sata od otvaranja.",
            },
            {
              label: "Podaci o računu",
              text: "Dok vaš račun postoji, i kratko nakon toga radi dovršetka brisanja, rješavanja sporova i sprječavanja izbjegavanja zabrane.",
            },
            {
              label: "Zapisi o sesijama, IP adrese i user-agent",
              text: "Do isteka tokena te sesije — najviše 30 dana za registrirani račun, 24 sata za gosta — nakon čega se uklanjaju. Brojači zahtjeva su kratkotrajni. Zapisi poslužitelja čuvaju se ograničeno vrijeme radi sigurnosti i otklanjanja grešaka.",
            },
            {
              label: "Podaci o igri",
              text: "Čuvaju se neograničeno, i nakon zatvaranja vašeg računa, uključujući u modelima, skupovima podataka, agregatima i statistikama izvedenima iz njih. Kada ih više ne trebamo vezane na vas, čuvamo ih u obliku koji nije vezan na vaš račun.",
            },
            {
              label: "Računovodstvene evidencije",
              text: "Onoliko dugo koliko zahtijeva hrvatsko porezno i računovodstveno pravo, u pravilu jedanaest godina.",
            },
            {
              label: "Prepiska",
              text: "Dok je potrebna za rješavanje predmeta, i nakon toga kada je relevantna za mogući pravni zahtjev.",
            },
          ],
        },
      ],
    },
    {
      id: "your-rights",
      heading: "Vaša prava",
      blocks: [
        {
          kind: "p",
          text: "Prema GDPR-u imate pravo:",
        },
        {
          kind: "list",
          items: [
            "zatražiti kopiju osobnih podataka koje o vama imamo (čl. 15.);",
            "ispraviti netočne podatke (čl. 16.);",
            "zatražiti brisanje podataka kada to zakon predviđa (čl. 17.);",
            "zatražiti ograničenje obrade dok se spor ne razriješi (čl. 18.);",
            "primiti svoje podatke u prenosivom, strojno čitljivom obliku (čl. 20.);",
            "podnijeti prigovor na obradu koja se temelji na našem legitimnom interesu, uključujući treniranje umjetne inteligencije opisano gore (čl. 21.);",
            "povući privolu u svakom trenutku, kada smo se oslonili na privolu (čl. 7.);",
            "podnijeti pritužbu nadzornom tijelu (čl. 77.).",
          ],
        },
        {
          kind: "p",
          text: `Pišite na ${entity.privacyEmail} i odgovorit ćemo u roku od jednog mjeseca ili vam objasniti zašto nam treba više vremena. Možemo od vas zatražiti da potvrdite svoj identitet prije nego što postupimo, kako podatke o vama ne bi mogao dobiti netko drugi tako što će ih zatražiti.`,
        },
        {
          kind: "p",
          text: "Dvije iskrene granice brisanja. Prvo, brisanje računa ne briše Podatke o igri niti modele, skupove podataka i statistike već izvedene iz njih — model se ne može „odtrenirati“, a te podatke koristimo za integritet igre i za svrhe opisane gore; ono što ćemo učiniti jest prekinuti neposrednu vezu između tih podataka i identiteta vašeg računa kada nam više nije potrebna. Drugo, možemo zadržati ono što moramo zadržati radi računovodstva, sigurnosti ili pravnih zahtjeva. Ako se s time gdje smo postavili tu granicu ne slažete, recite nam, a možete se obratiti i nadzornom tijelu.",
        },
      ],
    },
    {
      id: "complaints",
      heading: "Pritužbe",
      blocks: [
        {
          kind: "p",
          text: `Ako mislite da smo s vašim podacima postupali nezakonito, javite nam prvo na ${entity.privacyEmail}. Pritužbu možete podnijeti i hrvatskom nadzornom tijelu — ${supervisor.name}, ${supervisor.address} (${supervisor.site}) — ili nadzornom tijelu države EU u kojoj živite ili radite.`,
        },
      ],
    },
    {
      id: "security",
      heading: "Sigurnost",
      blocks: [
        {
          kind: "p",
          text: "Lozinke se čuvaju kao kriptografski sažetci sa solju, nikada u čitljivom obliku. Sesije koriste kratkotrajne pristupne tokene s rotirajućim tokenima za obnovu i automatskim ukidanjem cijele obitelji tokena ako se token ponovno upotrijebi, što ograničava štetu od ukradenog tokena. Broj zahtjeva je ograničen, a pristup produkcijskim podacima imaju samo oni kojima je potreban.",
        },
        {
          kind: "p",
          text: "Nijedna usluga ne može obećati potpunu sigurnost. Koristite lozinku koju ne koristite nigdje drugdje i javite nam ako mislite da je vaš račun ugrožen. Ako dođe do povrede koja će vjerojatno ugroziti vaša prava, obavijestit ćemo nadzorno tijelo i, kada je to propisano, vas.",
        },
      ],
    },
    {
      id: "children",
      heading: "Djeca",
      blocks: [
        {
          kind: "p",
          text: `Usluga nije za osobe mlađe od 16 godina i podatke od djece ne prikupljamo svjesno. Ako mislite da je dijete otvorilo račun, pišite na ${entity.privacyEmail} i izbrisat ćemo ga.`,
        },
      ],
    },
    {
      id: "cookies",
      heading: "Kolačići",
      blocks: [
        {
          kind: "p",
          text: "Postavljamo jedan kolačić koji pamti jezik koji ste odabrali, kako bi se stranica sljedeći put otvorila na njemu. Strogo je funkcionalan i ne prati vas po drugim stranicama, zbog čega nema ni obavijesti o kolačićima.",
        },
        {
          kind: "p",
          text: "Klijent igre koristi i lokalnu pohranu preglednika kako biste ostali prijavljeni. Ako kasnije dodamo analitičke ili reklamne kolačiće, pitat ćemo vas za privolu prije njihova postavljanja, a ovaj će dio to i reći.",
        },
      ],
    },
    {
      id: "changes",
      heading: "Promjene ovih pravila",
      blocks: [
        {
          kind: "p",
          text: "Ova pravila mijenjat ćemo kako Usluga raste — kada dodamo plaćanja, analitiku ili novu upotrebu Podataka o igri. Datum na vrhu pokazuje trenutačnu verziju.",
        },
        {
          kind: "p",
          text: "Ako promjena bitno utječe na to kako koristimo vaše osobne podatke, obavijestit ćemo vas e-poštom ili unutar Usluge prije nego što stupi na snagu.",
        },
      ],
    },
    {
      id: "contact",
      heading: "Kontakt",
      blocks: [
        {
          kind: "rows",
          rows: [
            {
              label: "Voditelj obrade",
              text: `${entity.name}, ${entity.address}`,
            },
            { label: "OIB", text: entity.oib },
            {
              label: "Privatnost i zahtjevi o podacima",
              text: entity.privacyEmail,
            },
            { label: "Podrška", text: entity.supportEmail },
            {
              label: "Nadzorno tijelo",
              text: `${supervisor.name}, ${supervisor.address} — ${supervisor.site}`,
            },
          ],
        },
      ],
    },
  ],
} satisfies LegalDocument;

export default privacy;
