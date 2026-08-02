import { t, type Dictionary } from "intlayer";

/**
 * Boilerplate policy copy. Bracketed values (registered name, company code)
 * are placeholders awaiting the real entity details.
 *
 * Bullet lists are arrays of `{ item }` rather than bare strings so every
 * array in this dictionary stays homogeneous, which keeps the generated
 * Intlayer types simple to map over.
 */
const privacypolicyContent = {
  key: "privacypolicy",
  content: {
    title: t({
      lt: "Privatumo politika",
      en: "Privacy Policy",
    }),
    description: t({
      lt: "Kaip Tattoo Station renka, naudoja ir saugo jūsų asmens duomenis.",
      en: "How Tattoo Station collects, uses and stores your personal data.",
    }),
    lastUpdatedLabel: t({
      lt: "Atnaujinta",
      en: "Last updated",
    }),
    lastUpdated: t({
      lt: "2026-08-02",
      en: "2026-08-02",
    }),
    intro: t({
      lt: "Ši privatumo politika paaiškina, kokius asmens duomenis renkame, kai lankotės tattoostation.lt arba pateikiate rezervacijos užklausą, kam juos naudojame, kiek laiko saugome ir kokias teises turite.",
      en: "This privacy policy explains what personal data we collect when you visit tattoostation.lt or send us a booking request, what we use it for, how long we keep it and what rights you have.",
    }),

    controllerHeading: t({
      lt: "Duomenų valdytojas",
      en: "Data controller",
    }),
    controllerBody: t({
      lt: "[Įmonės pavadinimas], įmonės kodas [000000000], Geležinkelio g. 1, Vilnius. El. paštas info@tattoostation.lt, tel. +370 650 682 30. Visais su asmens duomenimis susijusiais klausimais kreipkitės šiais kontaktais.",
      en: "[Registered company name], company code [000000000], Geležinkelio g. 1, Vilnius, Lithuania. Email info@tattoostation.lt, phone +370 650 682 30. Use these contacts for any question about your personal data.",
    }),

    dataHeading: t({
      lt: "Kokius duomenis renkame",
      en: "What data we collect",
    }),
    bookingDataLabel: t({
      lt: "Rezervacijos užklausa",
      en: "Booking request",
    }),
    bookingDataItems: [
      {
        item: t({
          lt: "Vardas.",
          en: "Your name.",
        }),
      },
      {
        item: t({
          lt: "El. pašto adresas ir telefono numeris.",
          en: "Email address and phone number.",
        }),
      },
      {
        item: t({
          lt: "Pasirinktas meistras ir paslauga (tatuiruotė, auskarų vėrimas ar kita).",
          en: "The artist and service you chose (tattoo, piercing or other).",
        }),
      },
      {
        item: t({
          lt: "Vieta ant kūno, pageidaujamas stilius, apytikslis dydis ir biudžeto rėžis.",
          en: "Body placement, preferred style, approximate size and budget range.",
        }),
      },
      {
        item: t({
          lt: "Pageidaujamas vizito laikas.",
          en: "Preferred times for your appointment.",
        }),
      },
      {
        item: t({
          lt: "Idėjos aprašymas ir nuoroda į pavyzdžius, jei ją pateikiate.",
          en: "Your description of the idea and a reference link, if you add one.",
        }),
      },
      {
        item: t({
          lt: "Jūsų įkeltos nuotraukos.",
          en: "Any photos you upload.",
        }),
      },
      {
        item: t({
          lt: "Ar pas mus lankotės pirmą kartą.",
          en: "Whether this is your first visit to us.",
        }),
      },
      {
        item: t({
          lt: "Sutikimas gauti naujienas — neprivalomas.",
          en: "Consent to receive news — optional.",
        }),
      },
    ],
    technicalDataLabel: t({
      lt: "Techniniai duomenys",
      en: "Technical data",
    }),
    technicalDataItems: [
      {
        item: t({
          lt: "Apibendrinta svetainės lankomumo statistika (Google Analytics 4).",
          en: "Aggregated website usage statistics (Google Analytics 4).",
        }),
      },
      {
        item: t({
          lt: "Iš kur atėjote į svetainę — nuorodos šaltinis ir kampanijos žymos.",
          en: "How you reached the site — referral source and campaign tags.",
        }),
      },
      {
        item: t({
          lt: "Apsaugos nuo šiukšlinių užklausų patikra pateikiant formą.",
          en: "An anti-spam check performed when the form is submitted.",
        }),
      },
    ],

    purposeHeading: t({
      lt: "Kam naudojame duomenis",
      en: "Why we use your data",
    }),
    purposeIntro: t({
      lt: "Surinktus duomenis naudojame tik šiais tikslais:",
      en: "We use the data we collect only for these purposes:",
    }),
    purposeItems: [
      {
        item: t({
          lt: "Atsakyti į jūsų užklausą ir suderinti vizito laiką — veiksmai, atliekami jūsų prašymu prieš sudarant sutartį.",
          en: "To answer your enquiry and arrange your appointment — steps taken at your request before providing the service.",
        }),
      },
      {
        item: t({
          lt: "Turėti idėjos aprašymą ir nuotraukas kaip atramą ruošiant eskizą ir konsultuojant.",
          en: "To keep your description and photos as a reference while preparing the design and consulting with you.",
        }),
      },
      {
        item: t({
          lt: "Siųsti naujienas, jeigu davėte atskirą sutikimą — jį galite bet kada atšaukti.",
          en: "To send news, if you gave separate consent — you can withdraw it at any time.",
        }),
      },
      {
        item: t({
          lt: "Suprasti, kaip naudojama svetainė, ir ją tobulinti.",
          en: "To understand how the site is used and to improve it.",
        }),
      },
    ],

    retentionHeading: t({
      lt: "Kiek laiko saugome",
      en: "How long we keep it",
    }),
    retentionBookingBody: t({
      lt: "Rezervacijos užklausas ir kartu su jomis įkeltas nuotraukas saugome 40 dienų nuo pateikimo. Jos naudojamos tik kaip atrama darbui — pasibaigus šiam terminui, ištrinamos.",
      en: "We keep booking requests and the photos uploaded with them for 40 days from submission. They are used only as a reference for the work, and are deleted once that period ends.",
    }),
    retentionOtherBody: t({
      lt: "Duomenis, kuriuos tvarkome jūsų sutikimu, pavyzdžiui, naujienoms, saugome tol, kol sutikimą atšaukiate. Su suteikta paslauga susijusius duomenis saugome tiek, kiek to reikalauja teisės aktai.",
      en: "Data we process on the basis of your consent, such as for news, is kept until you withdraw that consent. Data relating to a service we have provided is kept for as long as the law requires.",
    }),

    sharingHeading: t({
      lt: "Duomenų perdavimas",
      en: "Sharing your data",
    }),
    sharingIntro: t({
      lt: "Jūsų duomenų neparduodame ir neperduodame tretiesiems asmenims jų pačių tikslais. Tvarkyti duomenis mūsų vardu padeda tik šie paslaugų teikėjai:",
      en: "We do not sell your data and we do not pass it to third parties for their own purposes. Only these service providers process data on our behalf:",
    }),
    sharingItems: [
      {
        item: t({
          lt: "Resend — el. laiškų siuntimas: užklausos patvirtinimas jums ir pranešimas studijai.",
          en: "Resend — email delivery: your request confirmation and the notification to the studio.",
        }),
      },
      {
        item: t({
          lt: "Google Analytics 4 — apibendrinta svetainės lankomumo statistika.",
          en: "Google Analytics 4 — aggregated website usage statistics.",
        }),
      },
      {
        item: t({
          lt: "Cloudflare — svetainės talpinimas, failų saugojimas ir apsauga nuo šiukšlinių užklausų.",
          en: "Cloudflare — website hosting, file storage and spam protection.",
        }),
      },
    ],
    sharingOutro: t({
      lt: "Šie tiekėjai duomenis gali tvarkyti ir už Europos ekonominės erdvės ribų, taikant standartines sutarčių sąlygas. Duomenis taip pat galime pateikti kompetentingoms institucijoms, kai to reikalauja teisės aktai.",
      en: "These providers may process data outside the European Economic Area under standard contractual clauses. We may also disclose data to competent authorities where the law requires it.",
    }),

    cookiesHeading: t({
      lt: "Slapukai ir analitika",
      en: "Cookies and analytics",
    }),
    cookiesBody: t({
      lt: "Būtinuosius slapukus naudojame tam, kad veiktų rezervacijos forma ir apsauga nuo šiukšlinių užklausų. Google Analytics 4 slapukus statistikai įjungiame tik gavę jūsų sutikimą; jį galite bet kada atšaukti arba slapukus ištrinti naršyklės nustatymuose.",
      en: "We use strictly necessary cookies so that the booking form and its spam protection can work. Google Analytics 4 cookies are enabled only with your consent; you can withdraw it at any time or clear the cookies in your browser settings.",
    }),

    rightsHeading: t({
      lt: "Jūsų teisės",
      en: "Your rights",
    }),
    rightsIntro: t({
      lt: "Dėl savo asmens duomenų turite teisę:",
      en: "In relation to your personal data you have the right to:",
    }),
    rightsItems: [
      {
        item: t({
          lt: "Susipažinti su tvarkomais duomenimis ir gauti jų kopiją.",
          en: "Access the data we hold and receive a copy of it.",
        }),
      },
      {
        item: t({
          lt: "Reikalauti ištaisyti netikslius duomenis.",
          en: "Have inaccurate data corrected.",
        }),
      },
      {
        item: t({
          lt: "Reikalauti ištrinti duomenis.",
          en: "Have your data erased.",
        }),
      },
      {
        item: t({
          lt: "Apriboti duomenų tvarkymą arba su juo nesutikti.",
          en: "Restrict or object to the processing of your data.",
        }),
      },
      {
        item: t({
          lt: "Gauti duomenis įprastu formatu ir perkelti juos kitam valdytojui.",
          en: "Receive your data in a common format and transfer it to another controller.",
        }),
      },
      {
        item: t({
          lt: "Bet kada atšaukti duotą sutikimą.",
          en: "Withdraw any consent you have given, at any time.",
        }),
      },
    ],
    rightsOutro: t({
      lt: "Kreipkitės el. paštu info@tattoostation.lt — atsakysime ne vėliau kaip per 30 dienų. Jei atsakymas jūsų netenkina, turite teisę pateikti skundą Valstybinei duomenų apsaugos inspekcijai (vdai.lrv.lt).",
      en: "Write to info@tattoostation.lt and we will respond within 30 days. If you are not satisfied with our response, you may lodge a complaint with the Lithuanian State Data Protection Inspectorate (vdai.lrv.lt).",
    }),

    minorsHeading: t({
      lt: "Nepilnamečiai",
      en: "Minors",
    }),
    minorsBody: t({
      lt: "Paslaugas teikiame asmenims nuo 18 metų; nepilnamečiams — tik teisės aktų nustatyta tvarka ir dalyvaujant tėvams ar globėjams. Sąmoningai nerenkame jaunesnių nei 16 metų asmenų duomenų be tėvų ar globėjų sutikimo.",
      en: "We provide services to people aged 18 and over; for minors, only as the law allows and with a parent or guardian present. We do not knowingly collect data about anyone under 16 without a parent's or guardian's consent.",
    }),

    securityHeading: t({
      lt: "Saugumas",
      en: "Security",
    }),
    securityBody: t({
      lt: "Duomenys perduodami šifruotu ryšiu ir saugomi apsaugotoje aplinkoje. Prieigą prie užklausų ir nuotraukų turi tik tie studijos darbuotojai, kuriems ji būtina darbui.",
      en: "Data is transmitted over an encrypted connection and stored in a protected environment. Only those studio staff who need it for their work can access requests and photos.",
    }),

    changesHeading: t({
      lt: "Politikos pakeitimai",
      en: "Changes to this policy",
    }),
    changesBody: t({
      lt: "Šią politiką galime atnaujinti. Aktuali versija visada skelbiama šiame puslapyje kartu su atnaujinimo data.",
      en: "We may update this policy. The current version is always published on this page together with the date it was last updated.",
    }),

    contactHeading: t({
      lt: "Kontaktai",
      en: "Contact",
    }),
    contactBody: t({
      lt: "Tattoo Station, Geležinkelio g. 1, Vilnius. El. paštas info@tattoostation.lt, tel. +370 650 682 30.",
      en: "Tattoo Station, Geležinkelio g. 1, Vilnius. Email info@tattoostation.lt, phone +370 650 682 30.",
    }),
  },
} satisfies Dictionary;

export default privacypolicyContent;
