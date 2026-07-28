import { t, type Dictionary } from "intlayer";

const faqContent = {
  key: "faq",
  content: {
    title: t({
      lt: "DUK",
      en: "FAQ",
    }),
    description: t({
      lt: "Kaip prižiūrėti tatuiruotes ar piercing'ą",
      en: "How to look after fresh tattoos or piercings",
    }),
    aftercare_directions: t({
      lt: "Priežiūros instrukcijas rasi čia:",
      en: "Aftercare instructions are located here: ",
    }),
    buttonTextAftercare: t({
      lt: "Priežiūra",
      en: "Aftercare",
    }),
  },
} satisfies Dictionary;

export default faqContent;
