import { t, type Dictionary } from "intlayer";

const homeContent = {
  key: "home",
  content: { 
    title: t({
      lt: "Tattoo Station",
      en: "Tattoo Station",
    }),
    description: t({
      lt: "Tatuiruočių ir piercing'o paslaugos, jaukiai ir profesionaliai",
      en: "Tattoo and piercing service, cozy and professional",
    }),
    buttonTextArtists: t({
      lt: "Mūsų meistrai",
      en: "Our artists",
    }),
    subheading: t({
      lt: "Viena stotelė, begalė krypčių",
      en: "One stop, countless directions",
    }),
  },
} satisfies Dictionary;

export default homeContent;
