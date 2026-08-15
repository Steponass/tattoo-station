import { t, type Dictionary } from "intlayer";

const artistsContent = {
  key: "artists",
  content: {
    title: t({
      lt: "Mūsų meistrai",
      en: "Our artists",
    }),
    description: t({
      lt: "Pažink mūsų ekspertus ir jų darbus",
      en: "Get to know our experts and their works",
    }),
    buttonTextViewMore: t({
      lt: "Daugiau",
      en: "See more",
    }),
  },
} satisfies Dictionary;

export default artistsContent;
