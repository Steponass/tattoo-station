import { t, type Dictionary } from "intlayer";

const tattoostylesContent = {
  key: "tattoostyles",
  content: {
    title: t({
      lt: "Tatuiruočių stiliai",
      en: "Tattoo Styles",
    }),
    description: t({
      lt: "Susipažinkite su tatuiruočių stiliais, kuriuos atliekame studijoje",
      en: "Explore the tattoo styles we work in at the studio",
    }),
    neoTraditionalHeading: t({
      lt: "Neo-traditional",
      en: "Neo-traditional",
    }),
    neoTraditionalDescription: t({
      lt: "Šis stilius derina ryškias linijas su modernia iliustracija, kurdamas išraiškingus ir sodrius dizainus.",
      en: "This style pairs bold linework with modern illustration, creating expressive and richly saturated designs.",
    }),
    neoTraditionalImageAlt: t({
      lt: "Neo-traditional stiliaus kregždės iliustracija",
      en: "Neo-traditional style swallow illustration",
    }),
  },
} satisfies Dictionary;

export default tattoostylesContent;
