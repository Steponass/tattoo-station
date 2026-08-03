import { useMemo } from "react";
import { validatePrefix } from "intlayer";
import { data } from "react-router";
import type { Route } from "./+types/artists.$slug";
import { LocalizedLink } from "~/components/intlayer/LocalizedLink";
import { getDatabase } from "~/lib/cloudflare/cloudflareContext";
import { resolveLocale, type ArtistProfile } from "~/lib/artists/artistTypes";
import { findArtistProfileBySlug } from "~/lib/artists/artistRepository.server";
import {
  findArtistPhotos,
  type ArtistPhotoRecord,
} from "~/lib/artists/artistPhotoRepository.server";
import { buildPortfolioImageAttributes } from "~/lib/media/portfolioImageAttributes";
import ArtistGallery, {
  type PortfolioImage,
} from "~/components/ArtistProfile/ArtistGallery";
import { useLightboxLabels } from "~/components/Lightbox/useLightboxLabels";
import styles from "./artist.page.module.css";

type GalleryGroups = {
  tattooPhotos: PortfolioImage[];
  flashPhotos: PortfolioImage[];
};

function toPortfolioImage(record: ArtistPhotoRecord): PortfolioImage {
  return {
    id: record.id,
    objectKey: record.objectKey,
    width: record.width,
    height: record.height,
  };
}

/**
 * Splits an artist's photos into the two tabs the profile shows. Piercing-
 * category photos are excluded here — they belong on the piercing page, and
 * this gallery has no piercing tab.
 */
function buildGalleryGroups(records: ArtistPhotoRecord[]): GalleryGroups {
  return {
    tattooPhotos: records
      .filter((record) => record.category === "tattoo")
      .map(toPortfolioImage),
    flashPhotos: records
      .filter((record) => record.category === "flash")
      .map(toPortfolioImage),
  };
}

type ArtistAvatarView = {
  objectKey: string;
  width: number;
  height: number;
};

/**
 * Builds the avatar view only when the key and both dimensions are present
 * (they travel together by invariant). 
 *
 * Assumes avatars are served by the portfolio delivery route; revisit that
 * assumption when avatar upload lands and confirm the key prefix matches.
 */
function buildAvatarView(artist: ArtistProfile): ArtistAvatarView | null {
  const { profileImageKey, profileImageWidth, profileImageHeight } = artist;

  if (
    profileImageKey === null ||
    profileImageWidth === null ||
    profileImageHeight === null
  ) {
    return null;
  }

  return {
    objectKey: profileImageKey,
    width: profileImageWidth,
    height: profileImageHeight,
  };
}

export async function loader({ params, context }: Route.LoaderArgs) {
  const { lang, slug } = params;

  const { isValid } = validatePrefix(lang);

  if (!isValid) {
    throw data("Locale not supported", { status: 404 });
  }

  if (!slug) {
    throw data("Artist not found", { status: 404 });
  }

  const database = getDatabase(context);
  const locale = resolveLocale(lang);

  const artist = await findArtistProfileBySlug({ database, slug, locale });

  if (artist === null) {
    throw data("Artist not found", { status: 404 });
  }

  const photoRecords = await findArtistPhotos({ database, artistId: artist.id });

  return {
    artist,
    avatar: buildAvatarView(artist),
    galleryGroups: buildGalleryGroups(photoRecords),
  };
}

export const meta: Route.MetaFunction = ({ loaderData }) => {
  if (!loaderData) return [];

  const { artist } = loaderData;

  return [
    { title: artist.displayName },
    { name: "description", content: artist.bioExcerpt },
  ];
};

interface ArtistAvatarProps {
  avatar: ArtistAvatarView | null;
}

const ARTIST_AVATAR_SIZES = "(max-width: 1000px) 50vw, 500px";

function ArtistAvatar({ avatar }: ArtistAvatarProps) {
  if (avatar === null) {
    return null;
  }

  const { src, srcSet, sizes } = buildPortfolioImageAttributes({
    objectKey: avatar.objectKey,
    sizes: ARTIST_AVATAR_SIZES,
  });

  return (
    <img
      src={src}
      srcSet={srcSet}
      sizes={sizes}
      alt=""
      width={avatar.width}
      height={avatar.height}
      className={styles.artist_photo}
    />
  );
}

export default function ArtistProfileRoute({
  loaderData,
}: Route.ComponentProps) {
  const { artist, avatar, galleryGroups } = loaderData;
  const stylesLabel = artist.styles.join(" · ");
  const lightboxLabels = useLightboxLabels();

  // Memoised so the gallery's photo mapping doesn't rebuild on every
  // render — it takes this object as a useMemo dependency.
  const lightboxArtist = useMemo(
    () => ({ slug: artist.slug, displayName: artist.displayName }),
    [artist.slug, artist.displayName],
  );

  return (
    <main>
      <section className={styles.artist_section}>
        <article className={styles.artist_details}>
          <ArtistAvatar avatar={avatar} />
          <div className={styles.artist_text}>
            <h1>{artist.displayName}</h1>
            {stylesLabel.length > 0 ? <p>{stylesLabel}</p> : null}
            <p>{artist.bio}</p>
          </div>
        </article>
        <ArtistGallery
          tattooPhotos={galleryGroups.tattooPhotos}
          flashPhotos={galleryGroups.flashPhotos}
          labels={lightboxLabels}
          artist={lightboxArtist}
        />
        <div className={styles.bottom_nav}>
          <LocalizedLink to="/artists">Meistrai</LocalizedLink>
          <LocalizedLink to="/booking">Rezervuoti</LocalizedLink>
        </div>
      </section>
    </main>
  );
}