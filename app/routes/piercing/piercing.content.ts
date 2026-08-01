import { t, type Dictionary } from "intlayer";

const piercingContent = {
  key: "piercing",
  content: {
    title: t({
      lt: "Auskarų vėrimas",
      en: "Piercing",
    }),
    description: t({
      lt: "Profesionalus auskarų vėrimas, be streso",
      en: "Professional and stress-free piercing services",
    }),
    tableHeaderType: t({
      lt: "Tipas",
      en: "Type",
    }),
    tableHeaderPrice: t({
      lt: "Kaina",
      en: "Price",
    }),
    piercingService1: t({
      lt: "Ausų speneliai",
      en: "Earlobes",
    }),
    piercingPrice1: t({
      lt: "25€",
      en: "€25",
    }),
    piercingService2: t({
      lt: "Kremzlių vėrimai (helix, flat, conch)",
      en: "Cartilage piercings (helix, flat, conch)",
    }),
    piercingPrice2: t({
      lt: "35€",
      en: "€35",
    }),
    piercingService3: t({
      lt: "Sudėtingi kremzlių vėrimai (tragus, rook, daith, snug)",
      en: "Complex cartilage piercings (tragus, rook, daith, snug)",
    }),
    piercingPrice3: t({
      lt: "40€",
      en: "€40",
    }),
    piercingService4: t({
      lt: "Industrial",
      en: "Industrial",
    }),
    piercingPrice4: t({
      lt: "50€",
      en: "€50",
    }),
    piercingService5: t({
      lt: "Vėrimai veido srityje (nosis, lūpa, antakis)",
      en: "Facial piercings (nose, lip, eyebrow)",
    }),
    piercingPrice5: t({
      lt: "40€",
      en: "€40",
    }),
    piercingService6: t({
      lt: "Vėrimai burnos srityje (smiley, liežuvis)",
      en: "Oral piercings (smiley, tongue)",
    }),
    piercingPrice6: t({
      lt: "50€",
      en: "€50",
    }),
    piercingService7: t({
      lt: "Kūno auskarai (bamba, krūtų speneliai)",
      en: "Body piercings (navel, nipples)",
    }),
    piercingPrice7: t({
      lt: "50€",
      en: "€50",
    }),
    galleryHeading: t({
      lt: "Darbai",
      en: "Works",
    }),
    /**
     * The piercer's name and bio live here rather than in D1: this page is
     * hand-built around one person — her logo, her price list, her gallery —
     * so the copy belongs with the rest of the page's copy. The roster and
     * profile pages are the D1-backed surfaces. Paragraphs are split on the
     * blank line at render time.
     */
    artistName: t({
      lt: "Agnė Joana",
      en: "Agnė Joana",
    }),
    artistBio: t({
      lt: "Mano piercing’o kelionė prasidėjo dar paauglystėje - pradėjau nuo auskarų vėrimo sau pačiai, tada draugams, o galų gale tai išaugo iki darbo studijoje. Labiausiai šiame man patinka matyti žmonių šypsenas pamačius rezultatą, ir girdėti žodžius “tikrai neskaudėjo taip, kaip tikėjausi”. Tai mane džiugina ir motyvuoja.\n\nVadinu save chameleonu, nes dirbant tikrai galiu prisitaikyti prie kiekvieno žmogaus ir atsižvelgti į jo poreikius tuo metu - galiu užhype’int, arba kaip tik nuramint, plepėti visą laiką ar susikaupus patylėti, apkabinti arba duoti erdvės pabūt su savimi ir pakvėpuoti.\n\nRenkantis tikslią vėrimo vietą atsižvelgiu į du dalykus: estetiką ir anatomiją. Man svarbu ne tik, kad auskaras gražiai atrodytų ir puoštų, bet kad prisitaikytų prie kiekvieno žmogaus kūno linijų ir sklandžiai gytų.\n\nKolekcionuoju tatuiruotes ir atvirukus, auginu pačią mieliausią katę pasaulyje, klausau daug ir įvairios muzikos.",
      en: "My piercing journey started back in my teenage years - I began by piercing my own ears, then my friends', and eventually it grew into working at a studio. What I love most is seeing people's smiles when they see the result, and hearing them say \"that really didn't hurt as much as I expected.\" That's what makes me happy and keeps me motivated.\n\nI call myself a chameleon, because when I work I can genuinely adapt to each person and meet their needs in the moment - I can hype someone up, or just as easily calm them down, chat the whole time or sit quietly with them if they're focused, give a hug or simply give them space to be with themselves and breathe.\n\nWhen choosing the exact placement of a piercing, I consider two things: aesthetics and anatomy. It matters to me not just that the piece looks beautiful and flattering, but that it suits the lines of each person's body and heals smoothly.\n\nI collect tattoos and postcards, I'm raising the sweetest cat in the world, and I listen to a lot of varied music.",
    }),
  },
} satisfies Dictionary;

export default piercingContent;
