// app/lib/gallery/galleryCurationRepository.server.ts

import type { GalleryName } from "./galleryPlacementRepository.server";

/**
 * The read for admin curation pages. Returns every artist_photo row joined
 * with (a) its artist's display name and (b) its gallery placement, if any.
 *
 * Distinct from findPlacedPhotos / findPlaceablePhotos in the placement
 * repository: those serve the public site and the endpoint's internal
 * checks, where the caller either knows what's placed OR knows what's
 * placeable but not both. The curation pages need everything on one page —
 * one query, three-way partition in the component:
 *
 *   placement === null                          → available to place
 *   placement.gallery === current gallery       → placed here (draggable)
 *   placement.gallery === other gallery         → disabled with hint
 *
 * Ordered so the component's default view lands sensibly without further
 * sorting: roster order (artist), then artist name for ties, then the
 * artist's own portfolio order.
 */

export type PhotoForCuration = {
  photoId: number;
  objectKey: string;
  width: number;
  height: number;
  category: "tattoo" | "piercing" | "flash";
  artistId: number;
  artistDisplayName: string;
  placement: {
    gallery: GalleryName;
    sortOrder: number;
  } | null;
};

type PhotoForCurationRow = {
  photo_id: number;
  object_key: string;
  width: number;
  height: number;
  category: "tattoo" | "piercing" | "flash";
  artist_id: number;
  artist_display_name: string;
  placement_gallery: GalleryName | null;
  placement_sort_order: number | null;
};

const SELECT_PHOTOS_FOR_CURATION_SQL = `
  SELECT
    artist_photos.id           AS photo_id,
    artist_photos.object_key   AS object_key,
    artist_photos.width        AS width,
    artist_photos.height       AS height,
    artist_photos.category     AS category,
    artist_photos.artist_id    AS artist_id,
    artists.display_name       AS artist_display_name,
    gallery_placements.gallery    AS placement_gallery,
    gallery_placements.sort_order AS placement_sort_order
  FROM artist_photos
  JOIN artists
    ON artists.id = artist_photos.artist_id
  LEFT JOIN gallery_placements
    ON gallery_placements.photo_id = artist_photos.id
  ORDER BY
    artists.sort_order ASC,
    artists.display_name ASC,
    artist_photos.sort_order ASC
`;

export async function findPhotosForCuration({
  database,
}: {
  database: D1Database;
}): Promise<PhotoForCuration[]> {
  const queryResult = await database
    .prepare(SELECT_PHOTOS_FOR_CURATION_SQL)
    .all<PhotoForCurationRow>();

  return queryResult.results.map((row) => ({
    photoId: row.photo_id,
    objectKey: row.object_key,
    width: row.width,
    height: row.height,
    category: row.category,
    artistId: row.artist_id,
    artistDisplayName: row.artist_display_name,
    placement:
      row.placement_gallery === null || row.placement_sort_order === null
        ? null
        : {
            gallery: row.placement_gallery,
            sortOrder: row.placement_sort_order,
          },
  }));
}

/**
 * The subset of artist data needed by the CurationFilters dropdown. Roster
 * order matches the studio's public roster order — the filter reads like the
 * artists page. Includes only artists that have at least one photo, so the
 * dropdown doesn't offer options that would filter to nothing.
 */
export type ArtistFilterOption = {
  artistId: number;
  displayName: string;
};

const SELECT_ARTISTS_WITH_PHOTOS_SQL = `
  SELECT DISTINCT
    artists.id           AS artist_id,
    artists.display_name AS display_name
  FROM artists
  JOIN artist_photos ON artist_photos.artist_id = artists.id
  ORDER BY artists.sort_order ASC, artists.display_name ASC
`;

export async function findArtistFilterOptions({
  database,
}: {
  database: D1Database;
}): Promise<ArtistFilterOption[]> {
  const queryResult = await database
    .prepare(SELECT_ARTISTS_WITH_PHOTOS_SQL)
    .all<{ artist_id: number; display_name: string }>();

  return queryResult.results.map((row) => ({
    artistId: row.artist_id,
    displayName: row.display_name,
  }));
}