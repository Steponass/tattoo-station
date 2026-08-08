import { useMemo } from "react";
import { getIntlayer, validatePrefix } from "intlayer";
import { useIntlayer } from "react-intlayer";
import { data } from "react-router";
import type { Route } from "./+types/piercing";
import styles from "./piercing.module.css";
import Accordion from "~/components/Accordion/Accordion";
import { LocalizedLink } from "~/components/intlayer/LocalizedLink";
import { Lightbox, LightboxTrigger } from "~/components/Lightbox/Lightbox";
import type {
  LightboxArtistLink,
  LightboxPhoto,
} from "~/components/Lightbox/lightboxPhoto";
import { useLightboxLabels } from "~/components/Lightbox/useLightboxLabels";
import { getDatabase } from "~/lib/cloudflare/cloudflareContext";
import { findActiveArtistIdentityByRole } from "~/lib/artists/artistRepository.server";
import {
  findArtistPhotosByCategory,
  type ArtistPhotoRecord,
} from "~/lib/artists/artistPhotoRepository.server";
import { mainPhotoCategoryForRole } from "~/lib/artists/artistPhotoCategories";
import { buildPortfolioImageAttributes } from "~/lib/media/portfolioImageAttributes";

/**
 * A gallery photo as this page renders it — a delivery URL plus the stored
 * dimensions, so each tile reserves layout space before the image loads.
 */
interface GalleryPhoto {
  id: number;
  objectKey: string;
  width: number;
  height: number;
}

function toGalleryPhoto(record: ArtistPhotoRecord): GalleryPhoto {
  return {
    id: record.id,
    objectKey: record.objectKey,
    width: record.width,
    height: record.height,
  };
}

export async function loader({ params, context }: Route.LoaderArgs) {
  const { lang } = params;

  const { isValid } = validatePrefix(lang);

  if (!isValid) {
    throw data("Locale not supported", { status: 404 });
  }

  const database = getDatabase(context);

  const piercingArtist = await findActiveArtistIdentityByRole({
    database,
    role: "piercing",
  });

  // No active piercing artist yet: the page still renders (price list, bio,
  // FAQ are all hand-authored copy) with an empty gallery rather than 404ing.
  const photoRecords =
    piercingArtist === null
      ? []
      : await findArtistPhotosByCategory({
          database,
          artistId: piercingArtist.id,
          category: mainPhotoCategoryForRole("piercing"),
        });

  return {
    piercingArtistSlug: piercingArtist?.slug ?? null,
    photos: photoRecords.map(toGalleryPhoto),
  };
}

export const meta: Route.MetaFunction = ({ params }) => {
  const content = getIntlayer("piercing", params.lang);

  return [
    { title: content.title },
    { content: content.description, name: "description" },
  ];
};

export const handle = {
  titleBoard: { 
    show: true, 
    labelKey: "piercing",
    timing: { characterStaggerSeconds: 0.03, minimumFlapCount: 10 },
 },
};


/** Intrinsic size of the piercer's logo in /public — a fixed asset, not an
 *  uploaded avatar, so the dimensions are known at build time. */
const ARTIST_LOGO_SIZE = 96;

function toLightboxPhoto(
  photo: GalleryPhoto,
  artist: LightboxArtistLink | undefined,
): LightboxPhoto {
  return {
    id: photo.id,
    objectKey: photo.objectKey,
    width: photo.width,
    height: photo.height,
    artist,
  };
}

const PIERCING_TILE_SIZES = "(max-width: 720px) 100vw, 400px";

export default function piercing({ loaderData }: Route.ComponentProps) {
  const { piercingArtistSlug, photos } = loaderData;
  const content = useIntlayer("piercing");
  const lightboxLabels = useLightboxLabels();
  const bioParagraphs = content.artistBio.value.split("\n\n");

  // Undefined (not null) when there's no active piercing artist row yet, so
  // the spread in toLightboxPhoto omits `artist` entirely rather than
  // carrying a null — matching LightboxPhoto's optional-field contract.
  const lightboxArtist: LightboxArtistLink | undefined = useMemo(() => {
    if (piercingArtistSlug === null) {
      return undefined;
    }
    return { slug: piercingArtistSlug, displayName: content.artistName.value };
  }, [piercingArtistSlug, content.artistName.value]);

  // The visitor is already on the piercer's own page, so the lightbox's
  // "visit artist" button would be a no-op — showArtistLink stays off here.
  // `artist` is still attached to each photo purely to prefill book-now
  // with `?artist=<slug>`.
  const piercingLightboxPhotos = useMemo(
    () => photos.map((photo) => toLightboxPhoto(photo, lightboxArtist)),
    [photos, lightboxArtist],
  );

  const rows = [
    [content.piercingService1, content.piercingPrice1],
    [content.piercingService2, content.piercingPrice2],
    [content.piercingService3, content.piercingPrice3],
    [content.piercingService4, content.piercingPrice4],
    [content.piercingService5, content.piercingPrice5],
    [content.piercingService6, content.piercingPrice6],
    [content.piercingService7, content.piercingPrice7],
  ];

const { items: first_accordion, aftercareLinkLabel } = useIntlayer("faq-piercing1");
const { items: second_accordion } = useIntlayer("faq-piercing2");

// The first item's answer ends mid-sentence, pointing readers to the
// dedicated piercing aftercare page rather than repeating that copy here.
const first_accordion_items = first_accordion.map((item, index) =>
  index === 0
    ? {
        ...item,
        answer: (
          <>
            {item.answer}
            <LocalizedLink to="aftercare/aftercarePiercing">
              {aftercareLinkLabel}
            </LocalizedLink>
            .
          </>
        ),
      }
    : item,
);

  return (
    <main>
      <div className={styles.piercing_table_and_profile}>
        <section className={styles.section_price}>
          <table className={`${styles.piercing_table} chamfer chamfer-l`}>
            <thead>
              <tr>
                <th>{content.tableHeaderType}</th>
                <th>{content.tableHeaderPrice}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(([service, price], index) => (
                <tr key={index}>
                  <td>{service}</td>
                  <td>{price}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
          <div className={styles.artist_photo_and_name}>
            <img
              src='/Joana_Piercing_logo_transparent_bg_cropped.png'
              alt=""
              width={ARTIST_LOGO_SIZE}
              height={ARTIST_LOGO_SIZE}
              className={styles.artist_photo}
            />
            <h2>{content.artistName}</h2>
          </div>
        <article className={styles.artist_text}>
          <img className={styles.piercing_jewelry_1} src="/moon_cropped.webp">
            </img>
          {bioParagraphs.map((paragraph, index) => (
            <>
              {index === bioParagraphs.length - 1 && (
                <img
                  className={styles.piercing_jewelry_2}
                  src="/heart_cropped.webp"
                />
              )}
              <p key={index}>
                {paragraph}
              </p>
            </>
          ))}
        </article>
      </div>
      <section className={styles.section_piercing_gallery}>
        <h2>{content.galleryHeading}</h2>
        <Lightbox
          photos={piercingLightboxPhotos}
          labels={lightboxLabels}
          showArtistLink={false}
        >
          <div className={styles.piercing_gallery_grid}>
            {photos.map((photo) => (
              <PiercingTile key={photo.id} photo={photo} />
            ))}
          </div>
        </Lightbox>
      </section>
      <section className={styles.section_piercing_faq} id="piercing_faq">
        <h2>{content.faqHeading}</h2>
        <Accordion items={first_accordion_items} />
        <Accordion items={second_accordion}/>
      </section>
    </main>
  );
}

interface PiercingTileProps {
  photo: GalleryPhoto;
}

function PiercingTile({ photo }: PiercingTileProps) {
  const { src, srcSet, sizes } = buildPortfolioImageAttributes({
    objectKey: photo.objectKey,
    sizes: PIERCING_TILE_SIZES,
  });

  return (
    <LightboxTrigger
      photoId={photo.id}
      className={styles.artist_image_wrapper}
    >
      <img
        src={src}
        srcSet={srcSet}
        sizes={sizes}
        alt=""
        width={photo.width}
        height={photo.height}
        className={styles.artist_image}
        loading="lazy"
      />
    </LightboxTrigger>
  );
}