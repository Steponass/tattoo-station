import { t, type Dictionary } from "intlayer";

const flashdesignsContent = {
  key: "flashdesigns",
  content: {
    title: t({
      lt: "Laisvi eskizai",
      en: "Flash designs",
    }),
    description: t({
      lt: "Pasirink vieną iš mūsų meistrų eskizų",
      en: "Pick one of our artists' flash designs",
    }),
  },
} satisfies Dictionary;

export default flashdesignsContent;
