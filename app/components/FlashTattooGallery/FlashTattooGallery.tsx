// app/components/FlashTattooGallery/FlashTattooGallery.tsx

import { buildPortfolioImageUrl } from '~/lib/media/portfolioImageUrl'
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
 */

export type FlashGalleryPhoto = {
  photoId: number
  objectKey: string
  width: number
  height: number
  artistDisplayName: string
}

type FlashTattooGalleryProps = {
  photos: readonly FlashGalleryPhoto[]
}

export default function FlashTattooGallery(props: FlashTattooGalleryProps) {
  const { photos } = props

  if (photos.length === 0) {
    return <EmptyFlashGallery />
  }

  return (
    <section className={styles.flash_tattoo_gallery}>
      {photos.map((photo) => (
        <div key={photo.photoId} className={styles.artist_image_wrapper}>
          <img
            src={buildPortfolioImageUrl(photo.objectKey)}
            alt={`Flash design by ${photo.artistDisplayName}`}
            width={photo.width}
            height={photo.height}
            className={styles.artist_image}
            loading="lazy"
          />
        </div>
      ))}
    </section>
  )
}

function EmptyFlashGallery() {
  return (
    <section className={styles.empty_state}>
      <p className={styles.empty_state_message}>New flash designs coming soon.</p>
    </section>
  )
}