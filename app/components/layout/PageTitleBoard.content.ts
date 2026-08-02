import { t, type Dictionary } from "intlayer";
import type faq from "~/routes/faq/faq";

const pageTitleBoardContent = {
  key: "page-title-board",
  content: {
    home: t({
      lt: "Tattoo Station",
      en: "Tattoo Station",
    }),
    piercing: t({
      lt: "Auskarai",
      en: "Piercing",
    }),
    aftercare: t({
      lt: "Priežiūra",
      en: "Aftercare",
    }),
    faq: t({
      lt: "DUK",
      en: "FAQ",
    }),
    coupon: t({
      lt: "Giftcard",
      en: "Dovanų kuponas",
    }),
    styles: t({
      lt: "Tattoo stiliai",
      en: "Tattoo styles",
    }),
    flash: t({
      lt: "Laisvi eskizai",
      en: "Flash designs",
    }),
    privacy: t({
      lt: "Privatumas",
      en: "Privacy",
    }),
  },
} satisfies Dictionary;

export default pageTitleBoardContent;
