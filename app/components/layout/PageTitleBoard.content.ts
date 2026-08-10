import { t, type Dictionary } from "intlayer";

const pageTitleBoardContent = {
  key: "page-title-board",
  content: {
    home: t({
      lt: "Tattoo Station",
      en: "Tattoo Station",
    }),
    artists: t({
      lt: "Meistrai",
      en: "Artists",
    }),
    piercing: t({
      lt: "Auskarai",
      en: "Piercing",
    }),
    aftercare: t({
      lt: "Priežiūra",
      en: "Aftercare",
    }),
    aftercareTattoo: t({
      lt: "Tattoo priežiūra",
      en: "Tattoo aftercare",
    }),
    aftercarePiercing: t({
      lt: "Auskarų priežiūra",
      en: "Piercing aftercare",
    }),
    faq: t({
      lt: "DUK",
      en: "FAQ",
    }),
    coupon: t({
      lt: "Dovanų kuponas",
      en: "Giftcard",
    }),
    styles: t({
      lt: "Tattoo stiliai",
      en: "Tattoo styles",
    }),
    flash: t({
      lt: "Eskizai",
      en: "Flash designs",
    }),
    booking: t({
      lt: "Rezervuok",
      en: "Booking",
    }),
    privacy: t({
      lt: "Privatumas",
      en: "Privacy",
    }),
  },
} satisfies Dictionary;

export default pageTitleBoardContent;
