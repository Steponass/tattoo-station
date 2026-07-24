import { t, type Dictionary } from "intlayer";

const localeSwitcherContent = {
  key: "locale-switcher",
  content: {
    localeSwitcherLabel: t({
      lt: "Pakeisti kalbą į",
      en: "Change language to",
    }),
  },
} satisfies Dictionary;

export default localeSwitcherContent;