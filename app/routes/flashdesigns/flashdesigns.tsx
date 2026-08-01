import styles from "./flashdesigns.module.css";

// Intlayer start
import { getIntlayer, validatePrefix } from "intlayer";
import { data } from "react-router";
import type { Route } from "./+types/flashdesigns";
import FlashTattooGallery from "~/components/FlashTattooGallery/FlashTattooGallery";
import { useLightboxLabels } from "~/components/Lightbox/useLightboxLabels";
import { getCloudflareBindings } from "~/lib/cloudflare/cloudflareContext";
import { findPlacedPhotos } from "~/lib/gallery/galleryPlacementRepository.server";

// Intlayer Start
export const loader = async ({ params, context }: Route.LoaderArgs) => {
  const { lang } = params;

  const { isValid } = validatePrefix(lang);

  if (!isValid) {
    throw data("Locale not supported", { status: 404 });
  }

  const { env } = getCloudflareBindings(context);

  // The public flash page reads the same placements the admin curates at
  // /admin/flash. Ordering respects the admin's chosen sort_order via the
  // repository's ORDER BY. No caching layer here — D1 reads are fast enough
  // that a per-request query is fine, and mutual-exclusion + admin curation
  // means the data is small (typically <100 rows).
  const placedPhotos = await findPlacedPhotos({
    database: env.DB,
    gallery: "flash",
  });

  return { placedPhotos };
};

export const meta: Route.MetaFunction = ({ params }) => {
  const content = getIntlayer("flashdesigns", params.lang);

  return [
    { title: content.title },
    { content: content.description, name: "description" },
  ];
};
// Intlayer end

export default function flashdesigns({ loaderData }: Route.ComponentProps) {
  const { placedPhotos } = loaderData;

  const lightboxLabels = useLightboxLabels();

  return (
    <main>
      <FlashTattooGallery photos={placedPhotos} labels={lightboxLabels} />
    </main>
  );
}