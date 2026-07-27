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
  },
} satisfies Dictionary;

export default homeContent;
