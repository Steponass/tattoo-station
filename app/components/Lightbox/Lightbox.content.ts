// app/components/Lightbox/lightbox.content.ts

import { t, type Dictionary } from "intlayer";

/**
 * Shared UI copy for the Lightbox component. Every route that renders a
 * Lightbox pulls from this dictionary rather than duplicating strings on
 * its own — the buttons look the same on every page, and their labels
 * should too.
 *
 * Route usage:
 *
 *   const lightboxLabels = useIntlayer("lightbox");
 *   <FlashTattooGallery photos={...} labels={lightboxLabels} />
 *
 * The dictionary key `"lightbox"` is the string passed to `useIntlayer`;
 * keep it in sync with the `key` below.
 */
const lightboxContent = {
  key: "lightbox",
  content: {
    close: t({
      lt: "Uždaryti",
      en: "Close",
    }),
    previous: t({
      lt: "Ankstesnė nuotrauka",
      en: "Previous photo",
    }),
    next: t({
      lt: "Kita nuotrauka",
      en: "Next photo",
    }),
    bookNow: t({
      lt: "Rezervuoti",
      en: "Book now",
    }),
    /**
     * The word that precedes the artist's display name in the "visit
     * artist" button. The component appends the name at render time.
     * Lithuanian uses no preposition here — the artist's name is enough
     * on its own with the visual context of a button, so we keep the
     * prefix minimal.
     */
    visitArtistPrefix: t({
      lt: "Peržiūrėti",
      en: "Visit",
    }),
  },
} satisfies Dictionary;

export default lightboxContent;