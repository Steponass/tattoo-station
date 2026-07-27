import { t, type Dictionary } from "intlayer";

const aftercareContent = {
  key: "aftercare",
    content: {
    title: t({
      lt: "Priežiūra",
      en: "Aftercare",
    }),
    description: t({
      lt: "Kaip prižiūrėti tatuiruotes ar piercing'ą",
      en: "How to look after fresh tattoos or piercings",
    }),
    tattooAftercare: t({
      lt: "Tatuiruočių",
      en: "Tattoo",
    }),
    piercingAftercare: t({
      lt: "Piercing'o",
      en: "Piercing",
    }),
  },
} satisfies Dictionary;

export default aftercareContent;
