import { t, type Dictionary } from "intlayer";

const faqAftercareContent = {
  key: "faq-aftercare",
  content: {
    items: [
      {
        question: t({
          lt: "[Placeholder] Kaip prižiūrėti tatuiruotę po seanso?",
          en: "[Placeholder] How do I take care of my tattoo afterwards?",
        }),
        answer: t({
          lt: "[Placeholder] Atsakymas bus pridėtas vėliau.",
          en: "[Placeholder] Answer to be added later.",
        }),
      },
    ],
  },
} satisfies Dictionary;

export default faqAftercareContent;
