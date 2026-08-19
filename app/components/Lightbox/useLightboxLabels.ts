
import { useMemo } from "react";
import { useIntlayer } from "react-intlayer";
import type { LightboxLabels } from "./lightboxPhoto";

export function useLightboxLabels(): LightboxLabels {
  const dictionary = useIntlayer("lightbox");

  return useMemo<LightboxLabels>(
    () => ({
      close: String(dictionary.close),
      previous: String(dictionary.previous),
      next: String(dictionary.next),
      bookNow: String(dictionary.bookNow),
      visitArtistPrefix: String(dictionary.visitArtistPrefix),
    }),
    [dictionary],
  );
}
