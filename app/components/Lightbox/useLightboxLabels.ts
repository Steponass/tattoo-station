// app/components/Lightbox/useLightboxLabels.ts

import { useMemo } from "react";
import { useIntlayer } from "react-intlayer";
import type { LightboxLabels } from "./lightboxPhoto";

/**
 * Reads the shared `lightbox` dictionary and unwraps it into the plain
 * strings the Lightbox expects.
 *
 * Intlayer returns a proxy whose values are DictionaryValue nodes, not
 * strings; `String()` is what collapses them. Every route that renders a
 * gallery needs the same five strings, so the coercion lives here once
 * rather than being copy-pasted per route.
 *
 * This keeps the Lightbox *component* i18n-agnostic — it still receives
 * plain `LightboxLabels` and never imports Intlayer. The coupling sits in
 * this hook, alongside `Lightbox.content.ts`, which already owns the
 * dictionary.
 */
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
