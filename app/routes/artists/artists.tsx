import { getIntlayer, validatePrefix } from "intlayer";
import { useIntlayer, useLocale } from "react-intlayer";
import { data } from "react-router";
import type { Route } from "./+types/artists";
import Roster from "~/components/ArtistRoster/Roster";
import { getDatabase } from "~/lib/cloudflare/cloudflareContext";
import { findActiveArtistsForRoster } from "~/lib/artists/artistRepository.server";
import {
  findRosterPreviewPhotos,
  type RosterPreviewPhotoRecord,
} from "~/lib/artists/artistPhotoRepository.server";
import { resolveLocale, type ArtistRosterEntry } from "~/lib/artists/artistTypes";
import { buildPortfolioImageUrl } from "~/lib/media/portfolioImageUrl";
import type {
  RosterArtist,
  RosterAvatar,
  RosterPreviewPhoto,
} from "~/data/roster.types";

/**
 * Photos in each artist's teaser grid. Matches the six columns Roster.module.css
 * lays out on desktop; the narrow breakpoint reflows the same six into two
 * columns rather than asking for a different number.
 */
const ROSTER_PREVIEW_PHOTO_COUNT = 6;

/**
 * Buckets the flat preview-photo result by artist. One pass rather than a
 * `filter` per artist, which would be quadratic over the roster.
 */
function groupPreviewPhotosByArtist(
  records: RosterPreviewPhotoRecord[],
): Map<number, RosterPreviewPhoto[]> {
  const photosByArtist = new Map<number, RosterPreviewPhoto[]>();

  for (const record of records) {
    const photos = photosByArtist.get(record.artistId) ?? [];

    photos.push({
      id: record.id,
      url: buildPortfolioImageUrl(record.objectKey),
      width: record.width,
      height: record.height,
    });

    photosByArtist.set(record.artistId, photos);
  }

  return photosByArtist;
}

/**
 * Null unless the key and both dimensions are present — they are written
 * together by the avatar upload, so a partial row means no usable image.
 */
function buildAvatar(artist: ArtistRosterEntry): RosterAvatar | null {
  const { profileImageKey, profileImageWidth, profileImageHeight } = artist;

  if (
    profileImageKey === null ||
    profileImageWidth === null ||
    profileImageHeight === null
  ) {
    return null;
  }

  return {
    url: buildPortfolioImageUrl(profileImageKey),
    width: profileImageWidth,
    height: profileImageHeight,
  };
}

function buildRosterArtists({
  entries,
  previewPhotoRecords,
}: {
  entries: ArtistRosterEntry[];
  previewPhotoRecords: RosterPreviewPhotoRecord[];
}): RosterArtist[] {
  const photosByArtist = groupPreviewPhotosByArtist(previewPhotoRecords);

  return entries.map((entry) => ({
    id: entry.id,
    slug: entry.slug,
    name: entry.displayName,
    role: entry.role,
    styles: entry.styles,
    bioExcerpt: entry.bioExcerpt,
    avatar: buildAvatar(entry),
    // An artist with no photos yet keeps their roster row; the teaser grid
    // is what disappears, not the artist.
    previewPhotos: photosByArtist.get(entry.id) ?? [],
  }));
}

export async function loader({ params, context }: Route.LoaderArgs) {
  const { lang } = params;

  const { isValid } = validatePrefix(lang);

  if (!isValid) {
    throw data("Locale not supported", { status: 404 });
  }

  const database = getDatabase(context);
  const locale = resolveLocale(lang);

  // Independent reads: the preview query filters on `artists.is_active` itself
  // rather than on the ids the roster query returns, so neither waits on the
  // other. Any artist the roster drops simply leaves unused photos behind.
  const [entries, previewPhotoRecords] = await Promise.all([
    findActiveArtistsForRoster({ database, locale }),
    findRosterPreviewPhotos({
      database,
      photosPerArtist: ROSTER_PREVIEW_PHOTO_COUNT,
    }),
  ]);

  return { artists: buildRosterArtists({ entries, previewPhotoRecords }) };
}

export const handle = {
  titleBoard: { 
    show: true, 
    labelKey: "artists",
    timing: { characterStaggerSeconds: 0.03, minimumFlapCount: 8 },
 },
};

export const meta: Route.MetaFunction = ({ params }) => {
  const content = getIntlayer("artists", params.lang);

  return [
    { title: content.title },
    { content: content.description, name: "description" },
  ];
};

export default function ArtistsRoute({ loaderData }: Route.ComponentProps) {
  const { artists } = loaderData;
  const { viewFullProfileLabel, stylesSeparator } = useIntlayer("roster");
  const { title, buttonTextViewMore } = useIntlayer("artists");
  const { locale } = useLocale();

  return (
    <main>
      <Roster
        artists={artists}
        copy={{
          viewFullProfileLabel: viewFullProfileLabel.value,
          stylesSeparator: stylesSeparator.value,
        }}
        locale={locale}
        buttonText={buttonTextViewMore}
      />
    </main>
  );
}
