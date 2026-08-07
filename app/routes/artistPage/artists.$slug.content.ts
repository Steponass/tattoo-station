import { t, type Dictionary } from "intlayer";

const artistsSlugContent = {
  key: "artistsPage",
  content: {
    bookNow: t({
      lt: "Rezervuoti",
      en: "Book Now",
    }),
    artistsLink: t({
      lt: "Meistrai",
      en: "Artists",
    }),
    worksHeading: t({
      lt: "Darbai",
      en: "Works",
    }),
    tattoosTabLabel: t({
      lt: "Tatuiruotės",
      en: "Tattoos",
    }),
    flashTabLabel: t({
      lt: "Laisvi eskizai",
      en: "Flash designs",
    }),
  },
} satisfies Dictionary;

export default artistsSlugContent;
