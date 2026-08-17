import { entity } from "./entity";
import type { LegalDocument } from "./types";

/**
 * Croatian version of the Terms — the prevailing one, per the “Jezik” section.
 * Section ids match `terms.en.ts` exactly so anchors survive a language switch.
 */
const terms = {
  title: "Uvjeti korištenja",
  updatedLabel: "Zadnja izmjena",
  updated: "17. kolovoza 2026.",
  lede: `Ovi uvjeti čine ugovor između vas i ${entity.name} o korištenju ${entity.site}. Objašnjavaju što možete očekivati od nas, što mi očekujemo od vas i — u dijelu o podacima o igri i licenciji — koja prava dajete nama nad podacima koje stvara vaša igra. Taj dio pročitajte pažljivo.`,
  tocLabel: "Sadržaj",
  sections: [
    {
      id: "who-we-are",
      heading: "Tko smo i što ovi uvjeti pokrivaju",
      blocks: [
        {
          kind: "p",
          text: `${entity.site} („Usluga“) je online igra bele kojom upravlja ${entity.name}, ${entity.address}, OIB ${entity.oib}, upisan u ${entity.registration}.`,
        },
        {
          kind: "p",
          text: "Ovi uvjeti primjenjuju se od trenutka kada počnete koristiti Uslugu — bilo da otvorite račun, igrate kao gost ili samo pregledavate stranicu. Ako ih ne prihvaćate, ne koristite Uslugu.",
        },
        {
          kind: "p",
          text: "Naša Pravila privatnosti objašnjavaju što radimo s osobnim podacima i sastavni su dio ovih uvjeta.",
        },
      ],
    },
    {
      id: "eligibility",
      heading: "Tko može koristiti Uslugu",
      blocks: [
        {
          kind: "p",
          text: "Za korištenje Usluge morate imati najmanje 16 godina. Ako imate manje od 16 godina, ne možete otvoriti račun niti igrati, ni kao gost.",
        },
        {
          kind: "p",
          text: "Podaci koje unesete pri registraciji moraju biti točni, jedna osoba smije imati jedan račun, a Uslugu ne smijete koristiti tamo gdje bi to bilo protivno pravu koje se na vas primjenjuje.",
        },
      ],
    },
    {
      id: "accounts",
      heading: "Računi, korisnička imena i igra kao gost",
      blocks: [
        {
          kind: "p",
          text: "Odgovorni ste za sve što se dogodi na vašem računu i za to da lozinku zadržite za sebe. Javite nam bez odgode ako mislite da joj je pristupio netko drugi.",
        },
        {
          kind: "p",
          text: "Vaše korisničko ime je javno. Možemo preimenovati, povući ili blokirati korisničko ime koje se lažno predstavlja kao netko drugi, povređuje zaštićeni znak, uvredljivo je ili se koristi za reklamiranje. Korisnička imena možemo povući i s računa koji su dugo neaktivni.",
        },
        {
          kind: "p",
          text: "Možete igrati kao gost, bez registracije. Gostujuće sesije su privremene i ne ulaze u rangiranje: gostujući račun i njegovi podaci za prijavu brišu se automatski, u pravilu unutar 24 sata, a napredak vezan na gostujući račun nakon toga nije moguće vratiti niti prenijeti.",
        },
        {
          kind: "p",
          text: "Račun možete zatvoriti u svakom trenutku. Što se nakon toga događa s vašim podacima opisano je u Pravilima privatnosti i u dijelu o podacima o igri i licenciji.",
        },
      ],
    },
    {
      id: "fair-play",
      heading: "Fer igra i dopušteno korištenje",
      blocks: [
        {
          kind: "p",
          text: "Bela je igra u paru i njezin integritet u cijelosti počiva na tome da je ljudi igraju pošteno. Obvezujete se da nećete:",
        },
        {
          kind: "list",
          items: [
            "dogovarati se s drugim igračima, otkrivati svoje karte izvan igre ni unaprijed ugovarati rezultate;",
            "koristiti botove, solvere, skripte ni bilo koji softver ili pomoć koji igraju ili savjetuju umjesto vas, niti igrati u tuđe ime;",
            "voditi više računa, dijeliti račun ni koristiti račun druge osobe;",
            "namještati rejting, sezone, ljestvice ili spajanje igrača, među ostalim namjernim gubljenjem, „farmanjem“ suigrača ili napuštanjem partija kako biste izbjegli poraz;",
            "vrijeđati, uznemiravati, prijetiti, lažno se predstavljati ni slati neželjene poruke drugim igračima, u chatu ili na bilo koji drugi način;",
            "postavljati ni prikazivati sadržaj koji je nezakonit, koji širi mržnju, seksualan je ili povređuje tuđa prava, uključujući kao avatar ili korisničko ime;",
            "prikupljati podatke s Usluge automatiziranim putem ni u velikim količinama, niti preprodavati pristup Usluzi;",
            "obavljati obrnuti inženjering, dekompilirati, mijenjati ni na drugi način dirati u Uslugu, njezine klijente, protokol, sigurnosne mehanizme i ograničenja broja zahtjeva;",
            "pokušavati neovlašteno pristupiti bilo kojem računu, poslužitelju ili sustavu, niti drugim igračima onemogućavati igru.",
          ],
        },
        {
          kind: "p",
          text: "Ako smatramo da ste prekršili ova pravila, možemo — po vlastitoj ocjeni i bez prethodne obavijesti — ukloniti sadržaj, poništiti partije, prilagoditi ili poništiti vaš rejting, ukloniti vas s ljestvica, ograničiti funkcije, suspendirati vas ili trajno zatvoriti vaš račun. Kod težih ili ponovljenih kršenja možemo blokirati i povezane uređaje i mrežne adrese.",
        },
        {
          kind: "p",
          text: `Ako mislite da je odluka bila pogrešna, pišite nam na ${entity.supportEmail} i razmotrit ćemo je ponovno. Ne jamčimo, međutim, određeni ishod, a metode otkrivanja varanja možemo zadržati u tajnosti — njihovim detaljnim objašnjavanjem postale bi lako izbježive.`,
        },
      ],
    },
    {
      id: "ranked-play",
      heading: "Rangirana igra, rejting i ljestvice",
      blocks: [
        {
          kind: "p",
          text: "Rangirana igra koristi rejting koji se mijenja s vašim rezultatima. Može uključivati kvalifikacijske partije prije nego što se rejting prikaže, a rejtinzi se na početku sezone mogu poništiti ili ponovno kalibrirati.",
        },
        {
          kind: "p",
          text: "Rejting je funkcija Usluge, a ne vaše vlasništvo, i nema novčanu vrijednost. Možemo mijenjati sustav rejtinga, trajanje sezone, pravila spajanja igrača i način izračuna, te možemo prilagoditi, ponovno izračunati, poništiti ili ukloniti bilo koji rejting — uključujući vaš — kada to smatramo potrebnim za integritet ljestvice ili nakon greške u sustavu.",
        },
        {
          kind: "p",
          text: "Ljestvice, profili i snimke partija javni su po zadanome. Vaše korisničko ime, avatar, rejting, mjesto na ljestvici, povijest partija i zapis vaše igre mogu biti vidljivi svima na internetu, uključujući osobe bez računa, i mogu ih indeksirati pretraživači. Ne koristite korisničko ime koje vam nije ugodno objaviti.",
        },
      ],
    },
    {
      id: "your-content",
      heading: "Vaš sadržaj",
      blocks: [
        {
          kind: "p",
          text: "„Korisnički sadržaj“ znači sve što putem Usluge unesete ili prikažete: korisničko ime, avatar, podatke na profilu, poruke u chatu, nazive stolova te sve što nam pošaljete u korisničkoj podršci ili kao povratnu informaciju.",
        },
        {
          kind: "p",
          text: "Zadržavate prava koja na svojem Korisničkom sadržaju već imate. Za njega ste odgovorni i potvrđujete da imate prava potrebna za njegovo objavljivanje. Korisnički sadržaj koji je protivan ovim uvjetima ili zakonu možemo ukloniti.",
        },
        {
          kind: "p",
          text: "Nad Korisničkim sadržajem dajete nam licenciju opisanu u sljedećem dijelu, a prijedloge i povratne informacije koje nam pošaljete možemo slobodno koristiti, bez obveze prema vama.",
        },
      ],
    },
    {
      id: "data-licence",
      heading: "Podaci o igri i licencija",
      blocks: [
        {
          kind: "p",
          text: "Ovaj dio želimo da primijetite više od svih ostalih, jer je širi nego što možda očekujete.",
        },
        {
          kind: "p",
          text: "„Podaci o igri“ znače sve podatke nastale igrom na Usluzi ili u vezi s njom, uključujući: zvanja i ugovore, podijeljene i odigrane karte, deklaracije i njihovo bodovanje, ishode štihova i dijeljenja, konačne rezultate, vremena i vrijeme razmišljanja, prekide veze i zamjene, postavu stola i mjesta, rejtinge i promjene rejtinga, snimke partija, chat u igri, zapise o spajanju igrača te metapodatke i identifikatore koji sve to povezuju s računima, sesijama i uređajima.",
        },
        {
          kind: "p",
          text: "Dajete nam trajnu, neopozivu, svjetsku, neisključivu, besplatnu, u cijelosti plaćenu i prenosivu licenciju s pravom podlicenciranja za pohranu, reproduciranje, prilagodbu, izmjenu, prevođenje, analizu, agregiranje, spajanje s drugim podacima, izradu izvedenih djela, javno prikazivanje, distribuciju, objavljivanje, licenciranje i svako drugo iskorištavanje svih Podataka o igri i Korisničkog sadržaja, u cijelosti ili djelomično, na svakom mediju i svakim sredstvom, danas poznatim ili kasnije razvijenim, u bilo koju svrhu.",
        },
        {
          kind: "p",
          text: "Ta svrha izričito uključuje, bez ograničenja:",
        },
        {
          kind: "list",
          items: [
            "razvoj, treniranje, dodatno prilagođavanje, evaluaciju, mjerenje uspješnosti i primjenu modela umjetne inteligencije i strojnog učenja te programa koji igraju karte, uključujući modele koje stavljamo na raspolaganje drugima ili koristimo u komercijalne svrhe;",
            "izradu, objavu, licenciranje i prodaju skupova podataka izvedenih iz Podataka o igri, među ostalim za istraživanja i za treniranje modela od strane trećih osoba;",
            "istraživanje, statistiku, analitiku, razvoj proizvoda te otkrivanje varanja i zloupotreba;",
            "javno prikazivanje snimaka partija, dijeljenja, statistika i podataka s ljestvica te njihovo korištenje u dokumentaciji, marketingu i materijalima za medije;",
            "licenciranje ili prijenos svega navedenoga partnerima, izvođačima i pružateljima usluga te kupcu ili pravnom sljedniku u slučaju prodaje, spajanja ili reorganizacije našeg poslovanja.",
          ],
        },
        {
          kind: "p",
          text: "Ovu licenciju možemo koristiti bez obavijesti vama, bez navođenja autorstva i bez ikakve naknade, podjele prihoda ili druge protuvrijednosti, i to u obliku koji vas identificira te u pseudonimiziranom, agregiranom ili anonimiziranom obliku. Odričete se moralnih i sličnih prava koja biste mogli imati na Podacima o igri, u mjeri u kojoj vam zakon dopušta odricanje.",
        },
        {
          kind: "p",
          text: "Licencija ostaje na snazi i nakon zatvaranja, suspenzije ili brisanja vašeg računa. Kada su Podaci o igri jednom upotrijebljeni za treniranje modela ili ugrađeni u agregat, skup podataka ili objavljenu statistiku, vaše kasnije brisanje računa taj model, agregat, skup podataka ili statistiku ne poništava — i nismo dužni model ponovno trenirati, skup ponovno izgraditi niti ih povlačiti.",
        },
        {
          kind: "p",
          text: "Kada su Podaci o igri osobni podaci, na njihovu obradu primjenjuju se Pravila privatnosti, a ova licencija ne ukida prava koja vam daje GDPR — uključujući pravo na prigovor na obradu koja se temelji na našem legitimnom interesu. Ništa u ovom dijelu nema za cilj oduzeti vam pravo kojeg se ne možete zakonito odreći.",
        },
      ],
    },
    {
      id: "payments",
      heading: "Plaćene funkcije i pretplate",
      blocks: [
        {
          kind: "p",
          text: "Usluga je trenutačno besplatna. Ako uvedemo plaćene funkcije ili pretplate, na njih se primjenjuju uvjeti iz ovog dijela.",
        },
        {
          kind: "p",
          text: "Cijene su prikazane prije kupnje i uključuju PDV kada se PDV obračunava. Plaćanja obrađuje vanjski pružatelj platnih usluga; mi ne primamo niti čuvamo cjelovite podatke o vašoj kartici. Za ažurnost svojih podataka za plaćanje odgovorni ste vi.",
        },
        {
          kind: "p",
          text: "Pretplate se automatski obnavljaju na isto razdoblje dok ih ne otkažete. Otkazati možete u svakom trenutku, s učinkom od kraja razdoblja koje ste već platili; otkaz ne znači povrat novca za tekuće razdoblje, osim kada to zakon zahtijeva. O promjeni cijene obavijestit ćemo vas u razumnom roku prije nego što stupi na snagu, a vi je možete ne prihvatiti i otkazati pretplatu.",
        },
        {
          kind: "p",
          text: "Kao potrošač u EU u pravilu imate 14 dana za odustajanje od ugovora sklopljenog na daljinu. Kada kupujete digitalni sadržaj ili digitalnu uslugu čije isporučivanje započinjemo odmah, vi to izričito zahtijevate i potvrđujete da gubite pravo na odustajanje kada isporuka započne, a kod digitalnog sadržaja kada je izvršena u cijelosti. Time se ne dira u vaša zakonska prava ako digitalni sadržaj ili usluga ima nedostatak ili nije u skladu s opisom.",
        },
        {
          kind: "p",
          text: "Virtualni predmeti, kozmetika, rejtinzi i druga prava u igri predstavljaju licenciju za korištenje unutar Usluge. Nemaju novčanu vrijednost, ne mogu se zamijeniti za novac niti prodati ili prenijeti izvan Usluge.",
        },
      ],
    },
    {
      id: "availability",
      heading: "Dostupnost, promjene i jamstva",
      blocks: [
        {
          kind: "p",
          text: "Usluga je u aktivnom razvoju. Funkcije — uključujući rangiranu igru, snimke partija, sezone i protivnike s umjetnom inteligencijom — možemo dodavati, mijenjati, privremeno onemogućiti ili ukloniti, a Uslugu možemo isključiti radi održavanja ili je u cijelosti ukinuti u bilo kojem trenutku.",
        },
        {
          kind: "p",
          text: "Ne obećavamo određenu razinu dostupnosti, ni da će igra biti bez prekida veze i grešaka, ni da će zamjenska umjetna inteligencija na vašem mjestu igrati onako kako biste igrali vi, ni da podaci nikada neće biti izgubljeni. Osim jamstava koja vam daje potrošačko pravo i koja ne možemo isključiti, Usluga se pruža „kakva jest“ i „kako je dostupna“.",
        },
      ],
    },
    {
      id: "termination",
      heading: "Suspenzija i prekid",
      blocks: [
        {
          kind: "p",
          text: "Korištenje Usluge možete prekinuti i račun zatvoriti u svakom trenutku.",
        },
        {
          kind: "p",
          text: "Vaš pristup možemo suspendirati ili ukinuti — uz obavijest kada je to razumno moguće, a bez nje kada bi odgoda uzrokovala štetu — ako prekršite ove uvjete, ako smo na to zakonom obvezani ili ako Uslugu ukidamo.",
        },
        {
          kind: "p",
          text: "Prekidom prestaje vaše pravo na korištenje Usluge. Dijelovi o podacima o igri i licenciji, o odgovornosti i o mjerodavnom pravu ostaju na snazi, a Podaci o igri čuvaju se kako je opisano u Pravilima privatnosti.",
        },
      ],
    },
    {
      id: "liability",
      heading: "Odgovornost",
      blocks: [
        {
          kind: "p",
          text: "Odgovaramo vam za štetu koju uzrokujemo namjerno ili krajnjom nepažnjom, za smrt ili tjelesnu povredu uzrokovanu našom nepažnjom te za sve ostalo što nam hrvatsko i europsko potrošačko pravo ne dopušta isključiti. Ništa u ovim uvjetima tu odgovornost ne ograničava.",
        },
        {
          kind: "p",
          text: "U ostalome, i u mjeri u kojoj to zakon dopušta: ne odgovaramo za posrednu ili posljedičnu štetu, izgubljenu dobit, izgubljene podatke, izgubljeni rejting ni izgubljenu priliku; ne odgovaramo za postupanje drugih igrača; a naša ukupna odgovornost iz Usluge ograničena je na veći od dva iznosa — onoga koji ste nam platili u dvanaest mjeseci prije štetnog događaja ili 100 EUR. Budući da je Usluga besplatna ako ništa ne kupite, to će u pravilu značiti 100 EUR.",
        },
      ],
    },
    {
      id: "changes",
      heading: "Promjene ovih uvjeta",
      blocks: [
        {
          kind: "p",
          text: "Ove uvjete možemo mijenjati — na primjer kada dodamo funkcije ili kada se promijeni zakon. Datum na vrhu pokazuje kada smo to učinili posljednji put.",
        },
        {
          kind: "p",
          text: "Ako promjena bitno utječe na vaša prava, obavijestit ćemo vas u razumnom roku prije nego što stupi na snagu, e-poštom ili unutar Usluge. Nastavak korištenja Usluge nakon što promjena stupi na snagu znači da nove uvjete prihvaćate; ako ih ne prihvaćate, zatvorite račun.",
        },
      ],
    },
    {
      id: "law",
      heading: "Mjerodavno pravo i sporovi",
      blocks: [
        {
          kind: "p",
          text: "Na ove uvjete primjenjuje se pravo Republike Hrvatske. Ako ste potrošač s boravištem u EU, zadržavate i zaštitu prisilnih odredaba potrošačkog prava države u kojoj živite i postupak možete pokrenuti pred sudovima te države; mi protiv vas postupak možemo pokrenuti samo pred tim sudovima.",
        },
        {
          kind: "p",
          text: `Pišite nam prvo na ${entity.supportEmail} — većina sporova je nesporazum, a njega bismo radije riješili nego se o njemu prepirali. Ako pritužbu ne uspijemo riješiti, možete se obratiti tijelu za alternativno rješavanje potrošačkih sporova ili platformi Europske komisije za online rješavanje sporova, a pritužbu možete uputiti i hrvatskim tijelima za zaštitu potrošača.`,
        },
        {
          kind: "p",
          text: "Ako se pokaže da neka odredba ovih uvjeta nije provediva, ostale ostaju na snazi, a neprovediva odredba primjenjuje se u najvećoj mjeri koju zakon dopušta.",
        },
      ],
    },
    {
      id: "language",
      heading: "Jezik",
      blocks: [
        {
          kind: "p",
          text: "Ovi uvjeti objavljeni su na hrvatskom i engleskom jeziku. U slučaju razlike između verzija, hrvatska je mjerodavna.",
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
              label: "Pružatelj usluge",
              text: `${entity.name}, ${entity.address}`,
            },
            { label: "OIB", text: entity.oib },
            { label: "Podrška", text: entity.supportEmail },
            {
              label: "Privatnost i zahtjevi o podacima",
              text: entity.privacyEmail,
            },
          ],
        },
      ],
    },
  ],
} satisfies LegalDocument;

export default terms;
