import { t, type Dictionary } from "intlayer";

const footerContent = {
  key: "Footer",
  content: {
        tagline: t({
      lt: "Tatuiruotės, auskarai ir geros emocijos",
      en: "Tattoos, piercing, and good vibes",
    }),
        privacypolicy: t({
      lt: "Privatumo politika",
      en: "Privacy policy",
    }),
  },
} satisfies Dictionary;

export default footerContent;
