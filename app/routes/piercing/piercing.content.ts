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
  },
} satisfies Dictionary;

export default piercingContent;
