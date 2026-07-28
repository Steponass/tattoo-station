import { t, type Dictionary } from "intlayer";

const artistsContent = {
  key: "artists",
  content: {
    title: t({
      lt: "Mūsų meistrai",
      en: "Our artists",
    }),
    description: t({
      lt: "Patis gereusi",
      en: "Ze bestest",
    }),
    buttonTextViewMore: t({
      lt: "Daugiau",
      en: "See more",
    }),
  },
} satisfies Dictionary;

export default artistsContent;
