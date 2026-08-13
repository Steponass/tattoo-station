import styles from "./tattoostyles.module.css";

// Intlayer start
import { getIntlayer, validatePrefix } from "intlayer";
import { useIntlayer } from "react-intlayer";
import { data } from "react-router";
import type { Route } from "./+types/tattoostyles";
import StyleGallery from "~/components/StyleGallery/StyleGallery";
import { useLightboxLabels } from "~/components/Lightbox/useLightboxLabels";
import type { LightboxPhoto } from "~/components/Lightbox/lightboxPhoto";
import { getCloudflareBindings } from "~/lib/cloudflare/cloudflareContext";
import { findStyleGalleryPhotos } from "~/lib/gallery/styleGalleryRepository.server";

// Intlayer Start
export const loader = async ({ params, context }: Route.LoaderArgs) => {
  const { lang: locale } = params;

  const { isValid } = validatePrefix(locale);

  if (!isValid) {
    throw data("Locale not supported", { status: 404 });
  }

  const { env } = getCloudflareBindings(context);

  // Every style-tagged photo from every active artist, no curation — the
  // page shows whatever's tagged. Display order within a style comes from
  // style_sort_order, rewritten monthly by the scheduled shuffle (see
  // workers/app.ts / shuffleStyleGalleryOrder.server.ts).
  const photos = await findStyleGalleryPhotos({ database: env.DB });

  const photosByStyle: Record<string, LightboxPhoto[]> = {};

  for (const photo of photos) {
    const lightboxPhoto: LightboxPhoto = {
      id: photo.photoId,
      objectKey: photo.objectKey,
      width: photo.width,
      height: photo.height,
      alt: `${photo.style} tattoo by ${photo.artistDisplayName}`,
      artist: {
        slug: photo.artistSlug,
        displayName: photo.artistDisplayName,
      },
    };

    const existingGroup = photosByStyle[photo.style];
    if (existingGroup) {
      existingGroup.push(lightboxPhoto);
    } else {
      photosByStyle[photo.style] = [lightboxPhoto];
    }
  }

  return { photosByStyle };
};

export const meta: Route.MetaFunction = ({ params }) => {
  const content = getIntlayer("tattoostyles", params.lang);

  return [
    { title: content.title },
    { content: content.description, name: "description" },
  ];
};
// Intlayer end

// SPLITFLAP BOARD
export const handle = {
  titleBoard: {
    show: true,
    labelKey: "styles",
    timing: { characterStaggerSeconds: 0.03, minimumFlapCount: 10 },
  },
};

export default function tattoostyles({ loaderData }: Route.ComponentProps) {
  const content = useIntlayer("tattoostyles");
  const lightboxLabels = useLightboxLabels();
  const { photosByStyle } = loaderData;

  return (
    <main id={styles.tattoostyles_main}>
      {content.styles.map((style, index) => (
        <article key={index} className={styles.tattoostyle_article}>
            <div className={styles.tattoostyle_heading_and_description}>
              <h2>{style.heading}</h2>
              <p>{style.description}</p>
            </div>

            <StyleGallery
              photos={photosByStyle[style.styleKey]}
              labels={lightboxLabels}
            />
        </article>
      ))}
    </main>
  );
}
