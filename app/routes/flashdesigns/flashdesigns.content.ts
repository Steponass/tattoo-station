import { t, type Dictionary } from "intlayer";

const flashdesignsContent = {
  key: "flashdesigns",
  content: {
    title: t({
      lt: "Laisvi eskizai",
      en: "Flash designs",
    }),
    description: t({
      lt: "Gali pasirinkti vieną iš mūsų meistrų unikalių eskizų",
      en: "Pick one of our artists' unique flash designs",
    }),
  },
} satisfies Dictionary;

export default flashdesignsContent;
