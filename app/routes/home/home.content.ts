import { t, type Dictionary } from "intlayer";

const homeContent = {
  key: "home",
  content: { 
    title: t({
      lt: "Tattoo Studija Vilniuje",
      en: "Tattoo Studio in Vilnius",
    }),
    description: t({
      lt: "Profesionalus tattoo aptarnavimas",
      en: "Professional tattoo service",
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
