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
      lt: "Priežiūros instrukcijos",
      en: "Aftercare instructions ",
    }),
    piercing_directions: t({
      lt: "Piercingo DUK",
      en: "Piercing FAQs",
    }),
    beforeHeading: t({
      lt: "Prieš vizitą",
      en: "Before your visit",
    }),
    designHeading: t({
      lt: "Dizainas",
      en: "Design",
    }),
    bookingHeading: t({
      lt: "Rezervavimas",
      en: "Booking",
    }),
    buttonTextAftercare: t({
      lt: "Priežiūra",
      en: "Aftercare",
    }),
    buttonTextPiercing: t({
      lt: "Piercing'o DUK",
      en: "Piercing FAQs",
    }),
  },
} satisfies Dictionary;

export default faqContent;
