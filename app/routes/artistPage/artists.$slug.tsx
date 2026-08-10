import { useMemo } from "react";
import { validatePrefix } from "intlayer";
import { useIntlayer } from "react-intlayer";
import { data } from "react-router";
import type { Route } from "./+types/artists.$slug";
import { LocalizedLink } from "~/components/intlayer/LocalizedLink";
import { NavLink } from "react-router";
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

  const photoRecords = await findArtistPhotos({
    database,
    artistId: artist.id,
  });

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
  const content = useIntlayer("artistsPage");

  // Memoised so the gallery's photo mapping doesn't rebuild on every
  // render — it takes this object as a useMemo dependency.
  const lightboxArtist = useMemo(
    () => ({ slug: artist.slug, displayName: artist.displayName }),
    [artist.slug, artist.displayName],
  );

  return (
    <main>
        <article className={styles.artist_details}>
          <ArtistAvatar avatar={avatar} />
          <div className={styles.artist_text}>
            <h1>{artist.displayName}</h1>
            {stylesLabel.length > 0 ? <span className={styles.style_label}>{stylesLabel}</span> : null}
            <p>{artist.bio}</p>
            <div className={styles.insta_and_book_container}>
              {artist.instagramHandle ? (
                <LocalizedLink
                  to={`https://instagram.com/${artist.instagramHandle}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="42px"
                    height="42px"
                    viewBox="0 0 16 16"
                  >
                    <path
                      fill="currentColor"
                      d="M8 0C5.829 0 5.556.01 4.703.048C3.85.088 3.269.222 2.76.42a3.9 3.9 0 0 0-1.417.923A3.9 3.9 0 0 0 .42 2.76C.222 3.268.087 3.85.048 4.7C.01 5.555 0 5.827 0 8.001c0 2.172.01 2.444.048 3.297c.04.852.174 1.433.372 1.942c.205.526.478.972.923 1.417c.444.445.89.719 1.416.923c.51.198 1.09.333 1.942.372C5.555 15.99 5.827 16 8 16s2.444-.01 3.298-.048c.851-.04 1.434-.174 1.943-.372a3.9 3.9 0 0 0 1.416-.923c.445-.445.718-.891.923-1.417c.197-.509.332-1.09.372-1.942C15.99 10.445 16 10.173 16 8s-.01-2.445-.048-3.299c-.04-.851-.175-1.433-.372-1.941a3.9 3.9 0 0 0-.923-1.417A3.9 3.9 0 0 0 13.24.42c-.51-.198-1.092-.333-1.943-.372C10.443.01 10.172 0 7.998 0zm-.717 1.442h.718c2.136 0 2.389.007 3.232.046c.78.035 1.204.166 1.486.275c.373.145.64.319.92.599s.453.546.598.92c.11.281.24.705.275 1.485c.039.843.047 1.096.047 3.231s-.008 2.389-.047 3.232c-.035.78-.166 1.203-.275 1.485a2.5 2.5 0 0 1-.599.919c-.28.28-.546.453-.92.598c-.28.11-.704.24-1.485.276c-.843.038-1.096.047-3.232.047s-2.39-.009-3.233-.047c-.78-.036-1.203-.166-1.485-.276a2.5 2.5 0 0 1-.92-.598a2.5 2.5 0 0 1-.6-.92c-.109-.281-.24-.705-.275-1.485c-.038-.843-.046-1.096-.046-3.233s.008-2.388.046-3.231c.036-.78.166-1.204.276-1.486c.145-.373.319-.64.599-.92s.546-.453.92-.598c.282-.11.705-.24 1.485-.276c.738-.034 1.024-.044 2.515-.045zm4.988 1.328a.96.96 0 1 0 0 1.92a.96.96 0 0 0 0-1.92m-4.27 1.122a4.109 4.109 0 1 0 0 8.217a4.109 4.109 0 0 0 0-8.217m0 1.441a2.667 2.667 0 1 1 0 5.334a2.667 2.667 0 0 1 0-5.334"
                    />
                  </svg>
                </LocalizedLink>
              ) : null}
              <NavLink
                to={{
                  pathname: "/booking",
                  search: `?artist=${encodeURIComponent(artist.slug)}`,
                }}
                className="button_a chamfer chamfer-xs punch"
              >
                {content.bookNow}
              </NavLink>
            </div>
          </div>
        </article>
        <ArtistGallery
          tattooPhotos={galleryGroups.tattooPhotos}
          flashPhotos={galleryGroups.flashPhotos}
          labels={lightboxLabels}
          artist={lightboxArtist}
          worksHeading={String(content.worksHeading)}
          tattoosTabLabel={String(content.tattoosTabLabel)}
          flashTabLabel={String(content.flashTabLabel)}
        />
        <div className={styles.bottom_nav}>
          <LocalizedLink 
          to="/artists"
          className="button_a chamfer chamfer-xs punch"
          >{content.artistsLink}</LocalizedLink>
          <LocalizedLink
            to={{
              pathname: "/booking",
              search: `?artist=${encodeURIComponent(artist.slug)}`,
            }}
            className="button_b chamfer chamfer-xs punch"
          >
            {content.bookNow}
          </LocalizedLink>
        </div>
    </main>
  );
}