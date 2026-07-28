import { t, type Dictionary } from "intlayer";

const rosterContent = {
  key: "roster",
  content: {
    viewFullProfileLabel: t({
      en: "See more",
      lt: "Daugiau",
    }),
    stylesSeparator: t({
      en: "·",
      lt: "·",
    }),
  },
} satisfies Dictionary;

export default rosterContent;