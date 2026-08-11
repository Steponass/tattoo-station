import { t, type Dictionary } from "intlayer";

const footerContent = {
  key: "Footer",
  content: {
        tagline: t({
      lt: "Tavo istorijos, mūsų rankų darbas.",
      en: "Your stories, our craft.",
    }),
        privacypolicy: t({
      lt: "Privatumo politika",
      en: "Privacy policy",
    }),
  },
} satisfies Dictionary;

export default footerContent;
