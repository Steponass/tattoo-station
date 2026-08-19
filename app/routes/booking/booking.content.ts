import { type Dictionary, t } from "intlayer";

const bookingContent = {
  key: "booking",
  content: {
    title: t({
      lt: "Rezervacija",
      en: "Book your appointment",
    }),
    description: t({
      lt: "Susisiekite ir padėsim įgyvendinti tavo viziją",
      en: "Get in touch and we'll help you realize your vision",
    }),
    confirmationHeading: t({
      lt: "Užklausa gauta",
      en: "We got you",
    }),
    confirmationBody: t({
      lt: "Ačiū, netrukus susisieksime! Taip pat gausi patvirtinimo el. laišką.",
      en: "Thanks, we'll be in touch shortly! You'll also get a confirmation email.",
    }),
    confirmationReferenceLabel: t({
      lt: "Numeris: ",
      en: "Reference: ",
    }),
    confirmationStampText: t({
      lt: "GAUTA",
      en: "RECEIVED",
    }),
    confirmationCloseLabel: t({
      lt: "Uždaryti",
      en: "Close",
    }),
  },
} satisfies Dictionary;

export default bookingContent;
