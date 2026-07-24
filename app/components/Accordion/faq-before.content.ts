import { t, type Dictionary } from "intlayer";

const faqBeforeContent = {
  key: "faq-before",
  content: {
    items: [
      {
        question: t({
          lt: "[Placeholder] Ką reikia žinoti prieš tatuiruotę?",
          en: "[Placeholder] What should I know before getting a tattoo?",
        }),
        answer: t({
          lt: "[Placeholder] Atsakymas bus pridėtas vėliau.",
          en: "[Placeholder] Answer to be added later.",
        }),
      },
            {
        question: t({
          lt: "[Placeholder] Ką reikia žinoti prieš tatuiruotę?",
          en: "[Placeholder] What should I know before getting a tattoo?",
        }),
        answer: t({
          lt: "[Placeholder] Atsakymas bus pridėtas vėliau.",
          en: "[Placeholder] Answer to be added later.",
        }),
      },
    ],
  },
} satisfies Dictionary;

export default faqBeforeContent;
