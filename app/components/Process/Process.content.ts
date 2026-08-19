import { t, type Dictionary } from "intlayer";

const processContent = {
  key: "Process",
  content: {
    heading: t({
      en: "Process",
      lt: "Procesas",
    }),
    steps: [
      {
        number: "01",
        title: t({
          en: "Get in touch",
          lt: "Susisiek",
        }),
        text: t({
          en: "Drop us a message and tell us about your tattoo idea.",
          lt: "Parašyk mums ir trumpai papasakok savo tatuiruotės idėją.",
        }),
      },
      {
        number: "02",
        title: t({
          en: "Discuss your idea",
          lt: "Aptarsime idėją",
        }),
        text: t({
          en: "We'll choose the right artist and go over the design, size, placement, and price.",
          lt: "Išrinksime meistrą, aptarsime dizainą, dydį, vietą ir kainą.",
        }),
      },
      {
        number: "03",
        title: t({
          en: "Book your session",
          lt: "Rezervuok laiką",
        }),
        text: t({
          en: "We'll find a time that works for you and book your session.",
          lt: "Suderinsime tau tinkamą vizito laiką ir jį rezervuosime.",
        }),
      },
      {
        number: "04",
        title: t({
          en: "Tattoo day",
          lt: "Tatuiruotės diena",
        }),
        text: t({
          en: "Come to the studio — we'll take care of the rest.",
          lt: "Atvyk į studiją, o visa kita palik mums.",
        }),
      },
    ],
  },
} satisfies Dictionary;

export default processContent;
