// app/components/FlashTattooGallery/FlashTattooGallery.tsx

import { useMemo } from 'react'
import { buildPortfolioImageAttributes } from "~/lib/media/portfolioImageAttributes";
import { Lightbox, LightboxTrigger } from '~/components/Lightbox/Lightbox'
import type { LightboxLabels, LightboxPhoto } from '~/components/Lightbox/lightboxPhoto'
import styles from './FlashTattooGallery.module.css'

/**
 * Renders the flash-designs gallery. Photos come from D1 via
 * gallery_placements (gallery='flash'), curated by the admin at /admin/flash.
 *
 * This component is presentation-only: takes photos as props, renders them.
 * The parent route's loader owns the D1 read. That separation means the
 * component is trivially testable and reusable — the /flashdesigns page
 * uses it now, but the /admin/flash curation page could use it too as a
 * preview surface if we ever want one.
 *
 * Empty state renders a modest placeholder rather than hiding the section
 * entirely. A missing gallery is meaningful to visitors — the studio does
 * flash — so we tell them it's coming rather than pretending the page
 * has no reason to exist.
 *
 * Each tile is wrapped in a <LightboxTrigger>. Clicking a tile opens
 * a single shared <Lightbox> that carries every photo in the gallery, so
 * prev/next navigation works across the whole set. The domain photo shape
 * (FlashGalleryPhoto) is mapped to the lightbox's shape (LightboxPhoto)
 * here — the lightbox stays gallery-agnostic and every gallery owns its
 * own mapping.
 */

export type FlashGalleryPhoto = {
  photoId: number
  objectKey: string
  width: number
  height: number
  artistDisplayName: string
  /**
   * Slug is needed on each photo now so the lightbox can link the "visit
   * artist" and "book now" buttons. If the D1 read doesn't already
   * expose the artist slug for flash placements, the loader/repository
   * needs to include it — findPlacedPhotos already returns artistSlug,
   * so the flashdesigns route needs to pass it through.
   */
  artistSlug: string
}

const FLASH_TILE_SIZES = "(max-width: 720px) 100vw, 400px";

type FlashTattooGalleryProps = {
  photos: readonly FlashGalleryPhoto[]
  labels: LightboxLabels
}

export default function FlashTattooGallery(props: FlashTattooGalleryProps) {
  const { photos, labels } = props

  const lightboxPhotos = useMemo<readonly LightboxPhoto[]>(
    () => photos.map(toLightboxPhoto),
    [photos],
  )

  if (photos.length === 0) {
    return <EmptyFlashGallery />
  }

  return (
    <Lightbox photos={lightboxPhotos} labels={labels}>
      <section className={styles.flash_tattoo_gallery}>
        {photos.map((photo) => (
          <FlashTile key={photo.photoId} photo={photo} />
        ))}
      </section>
    </Lightbox>
  )
}

interface FlashTileProps {
  photo: FlashGalleryPhoto
}

function FlashTile({ photo }: FlashTileProps) {
  const { src, srcSet, sizes } = buildPortfolioImageAttributes({
    objectKey: photo.objectKey,
    sizes: FLASH_TILE_SIZES,
  })

  return (
    <LightboxTrigger
      photoId={photo.photoId}
      className='gallery-image-wrapper'
    >
      <img
        src={src}
        srcSet={srcSet}
        sizes={sizes}
        alt={`Flash design by ${photo.artistDisplayName}`}
        width={photo.width}
        height={photo.height}
        className='gallery-image'
        loading="lazy"
      />
    </LightboxTrigger>
  )
}

function toLightboxPhoto(photo: FlashGalleryPhoto): LightboxPhoto {
  return {
    id: photo.photoId,
    objectKey: photo.objectKey,
    width: photo.width,
    height: photo.height,
    alt: `Flash design by ${photo.artistDisplayName}`,
    artist: {
      slug: photo.artistSlug,
      displayName: photo.artistDisplayName,
    },
  }
}

function EmptyFlashGallery() {
  return (
    <section className={styles.empty_state}>
      <p className={styles.empty_state_message}>New flash designs coming soon.</p>
    </section>
  )
}