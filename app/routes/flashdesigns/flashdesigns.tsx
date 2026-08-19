import { getIntlayer, validatePrefix } from "intlayer";
import { data } from "react-router";
import type { Route } from "./+types/flashdesigns";
import FlashTattooGallery from "~/components/FlashTattooGallery/FlashTattooGallery";
import { useLightboxLabels } from "~/components/Lightbox/useLightboxLabels";
import { getCloudflareBindings } from "~/lib/cloudflare/cloudflareContext";
import { findPlacedPhotos } from "~/lib/gallery/galleryPlacementRepository.server";

export const loader = async ({ params, context }: Route.LoaderArgs) => {
  const { lang } = params;

  const { isValid } = validatePrefix(lang);

  if (!isValid) {
    throw data("Locale not supported", { status: 404 });
  }

  const { env } = getCloudflareBindings(context);

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

// SPLITFLAP BOARD
export const handle = {
  titleBoard: {
    show: true,
    labelKey: "flash",
    timing: { characterStaggerSeconds: 0.03, minimumFlapCount: 10 },
  },
};

export default function flashdesigns({ loaderData }: Route.ComponentProps) {
  const { placedPhotos } = loaderData;

  const lightboxLabels = useLightboxLabels();

  return (
    <main>
      <FlashTattooGallery photos={placedPhotos} labels={lightboxLabels} />
    </main>
  );
}