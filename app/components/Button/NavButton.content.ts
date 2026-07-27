import { t, type Dictionary } from "intlayer";

const localeSwitcherContent = {
  key: "nav-button",
  content: {
    buttonText: t({
      lt: "Daugiau",
      en: "View more",
    }),
  },
} satisfies Dictionary;

export default localeSwitcherContent;