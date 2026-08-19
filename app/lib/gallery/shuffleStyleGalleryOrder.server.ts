import {
  findStyleGalleryPhotos,
  rewriteStyleGallerySortOrder,
} from "./styleGalleryRepository.server";

/** Gap between style_sort_order values, matching the project's 10/20/30 seed spacing. */
const SORT_ORDER_INCREMENT = 10;

/**
 * The monthly reshuffle for /tattoostyles. Called from the Worker's
 * `scheduled` handler (see workers/app.ts) on the 1st of each month, and
 * safe to call manually (e.g. via `wrangler dev --test-scheduled`) to seed
 * the initial order right after the style_sort_order column is added,
 * rather than waiting for the next scheduled run.
 *
 * Photos are shuffled within their own style group only — mixing "Realism"
 * photos into the "Blackwork" order would be meaningless, since each style
 * section renders its own group independently.
 */
export async function shuffleStyleGalleryOrder({
  database,
}: {
  database: D1Database;
}): Promise<void> {
  const photos = await findStyleGalleryPhotos({ database });

  const photoIdsByStyle = new Map<string, number[]>();

  for (const photo of photos) {
    const existing = photoIdsByStyle.get(photo.style);
    if (existing) {
      existing.push(photo.photoId);
    } else {
      photoIdsByStyle.set(photo.style, [photo.photoId]);
    }
  }

  for (const photoIds of photoIdsByStyle.values()) {
    shuffleInPlace(photoIds);
  }

  await rewriteStyleGallerySortOrder({
    database,
    photoIdsByStyle,
    sortOrderIncrement: SORT_ORDER_INCREMENT,
  });
}

/** Fisher-Yates, in place. */
function shuffleInPlace(items: number[]): void {
  for (let i = items.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [items[i], items[j]] = [items[j], items[i]];
  }
}
