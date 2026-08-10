import { t, type Dictionary } from "intlayer";

const couponContent = {
  key: "coupon",
  content: {
    title: t({
      lt: "Dovanų kuponas",
      en: "Giftcard",
    }),
    description: t({
      lt: "Nustebink artimą žmogų originalia dovanėle",
      en: "Surprise someone with a little tattoo magic",
    }),
    leadText: t({
      lt: "Vienas bilietas, be nustatytos paskirties vietos: žmogus pats išsirenka meistrą, dizainą ir dieną. Kuponą įsigyti ir tinkinti galima mūsų partnerio Korta platformoje.",
      en: "One ticket, no fixed destination — the recipient picks the artist, the design, and the day. Purchase and customise the gift card through our partner platform, Korta.",
    }),
    ticketEyebrow: t({
      lt: "Dovanų bilietas",
      en: "Gift ticket",
    }),
    routeFrom: t({
      lt: "Idėja",
      en: "Idea",
    }),
    routeTo: t({
      lt: "Tatuiruotė",
      en: "Tattoo",
    }),
    ctaText: t({
      lt: "Pirkti kuponą",
      en: "Get the gift card",
    }),
    ctaNote: t({
      lt: "Atsidarys naujame lange, korta.app",
      en: "Opens in a new tab, korta.app",
    }),
  },
} satisfies Dictionary;

export default couponContent;
