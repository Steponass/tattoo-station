import { Lightbox, LightboxTrigger } from '~/components/Lightbox/Lightbox'
import type {
  LightboxLabels,
  LightboxPhoto,
} from '~/components/Lightbox/lightboxPhoto'
import styles from './StyleGallery.module.css'

/**
 * The per-style example grid on /tattoostyles.
 *
 * The page has no photo source yet — nothing writes style-tagged photos to
 * a loader — so `photos` is empty in practice and the grid falls back to
 * the coloured placeholder tiles it has always rendered. The lightbox
 * wiring is in place so that the day a loader passes real photos (most
 * likely `artist_photos` filtered by the `style` column, which already
 * exists), tiles become clickable with no further change here.
 *
 * Photos arrive already mapped to `LightboxPhoto` rather than in a
 * gallery-specific shape: with no data source there is no domain shape to
 * map from, and inventing one now would be guessing. When the source
 * lands, move the mapping in here the way FlashTattooGallery does it.
 */

const PLACEHOLDER_TILE_COUNT = 6

type StyleGalleryProps = {
  photos?: readonly LightboxPhoto[]
  labels: LightboxLabels
}

export default function StyleGallery(props: StyleGalleryProps) {
  const { photos = [], labels } = props

  if (photos.length === 0) {
    return (
      <div className={styles.style_gallery_container}>
        {Array.from({ length: PLACEHOLDER_TILE_COUNT }, (_, index) => (
          <div key={index} className={styles.placeholder}></div>
        ))}
      </div>
    )
  }

  return (
    <Lightbox photos={photos} labels={labels}>
      <div className={styles.style_gallery_container}>
        {photos.map((photo) => (
          <LightboxTrigger
            key={photo.id}
            photoId={photo.id}
            className={styles.style_gallery_tile}
          >
            <img
              src={photo.src}
              alt={photo.alt ?? ''}
              width={photo.width}
              height={photo.height}
              className={styles.style_gallery_image}
              loading='lazy'
            />
          </LightboxTrigger>
        ))}
      </div>
    </Lightbox>
  )
}
