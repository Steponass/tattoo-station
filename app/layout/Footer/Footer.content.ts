import { t, type Dictionary } from "intlayer";

const footerContent = {
  key: "Footer",
  content: {
        privacypolicy: t({
      lt: "Privatumo politika",
      en: "Privacy policy",
    }),
  },
} satisfies Dictionary;

export default footerContent;
