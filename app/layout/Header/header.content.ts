import { t, type Dictionary } from "intlayer";

const headerContent = {
  key: "header",
  content: {
    booking: t({
      lt: "Rezervuoti",
      en: "Book now",
    }),
    artists: t({
      lt: "Meistrai",
      en: "Artists",
    }),
    piercing: t({
      lt: "Piercing",
      en: "Piercing",
    }),
    flashdesigns: t({
      lt: "Laisvi eskizai",
      en: "Flash Designs",
    }),
    tattoostyles: t({
      lt: "Tattoo stiliai",
      en: "Tattoo Styles",
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
      lt: "Dovanų kuponas",
      en: "Gift card",
    }),
  },
} satisfies Dictionary;

export default headerContent;
