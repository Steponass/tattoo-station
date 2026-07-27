import { t, type Dictionary } from "intlayer";

const pageTitleBoardContent = {
  key: "page-title-board",
  content: {
    piercing: t({
      lt: "Auskarai",
      en: "Piercing",
    }),
    aftercare: t({
      lt: "Priežiūra",
      en: "Aftercare",
    }),
  },
} satisfies Dictionary;

export default pageTitleBoardContent;
