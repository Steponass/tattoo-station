import { t, type Dictionary } from "intlayer";

const faqBookingContent = {
  key: "faq-booking",
  content: {
    items: [
      {
        question: t({
          lt: "[Placeholder] Kaip užsiregistruoti seansui?",
          en: "[Placeholder] How do I book a session?",
        }),
        answer: t({
          lt: "[Placeholder] Atsakymas bus pridėtas vėliau.",
          en: "[Placeholder] Answer to be added later.",
        }),
      },
    ],
  },
} satisfies Dictionary;

export default faqBookingContent;
