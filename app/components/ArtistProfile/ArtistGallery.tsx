import { useMemo } from 'react'
import { Lightbox, LightboxTrigger } from '~/components/Lightbox/Lightbox'
import type {
  LightboxArtistLink,
  LightboxLabels,
  LightboxPhoto,
} from '~/components/Lightbox/lightboxPhoto'
import { buildPortfolioImageAttributes } from '~/lib/media/portfolioImageAttributes'
import styles from './ArtistGallery.module.css'

/**
 * A single portfolio image ready to render: a delivery URL plus the stored
 * dimensions, so each tile reserves layout space before the image loads.
 */
export interface PortfolioImage {
  id: number
  objectKey: string
  width: number
  height: number
}

interface ArtistGalleryProps {
  tattooPhotos: PortfolioImage[]
  flashPhotos: PortfolioImage[]
  labels: LightboxLabels
  /**
   * Whose gallery this is. Not used for a "visit artist" button — the
   * visitor is already here — but it prefills the lightbox's book-now link
   * with `?artist=<slug>`, which is the whole point of showing a photo
   * full-screen on an artist's page.
   */
  artist: LightboxArtistLink
}

interface PortfolioTileProps {
  photo: PortfolioImage
}

const PORTFOLIO_TILE_SIZES = '(max-width: 720px) 100vw, 400px'

/** Gallery images are decorative (no per-image alt, by decision), so alt is
 * intentionally empty. */
function PortfolioTile({ photo }: PortfolioTileProps) {
  const { src, srcSet, sizes } = buildPortfolioImageAttributes({
    objectKey: photo.objectKey,
    sizes: PORTFOLIO_TILE_SIZES,
  })

  return (
    <LightboxTrigger photoId={photo.id} className={styles.artist_image_wrapper}>
      <img
        src={src}
        srcSet={srcSet}
        sizes={sizes}
        alt=''
        width={photo.width}
        height={photo.height}
        className={styles.artist_image}
      />
    </LightboxTrigger>
  )
}

/** The tabs hold two independent photo sets, so each panel gets its own
 * <Lightbox> rather than one shared across both. Prev/next then stays inside
 * the tab the visitor opened from — walking from the last tattoo into the
 * first flash design would be a jump they never asked for. Photo ids are
 * unique across the whole artist_photos table, so a `#photo-<id>` deep link
 * still resolves in exactly one of the two. */
function toLightboxPhoto(
  photo: PortfolioImage,
  artist: LightboxArtistLink,
): LightboxPhoto {
  return {
    id: photo.id,
    objectKey: photo.objectKey,
    width: photo.width,
    height: photo.height,
    artist,
  }
}

export default function ArtistGallery({ tattooPhotos, flashPhotos, labels, artist }: ArtistGalleryProps) {
  const tattooLightboxPhotos = useMemo(
    () => tattooPhotos.map((photo) => toLightboxPhoto(photo, artist)),
    [tattooPhotos, artist],
  )
  const flashLightboxPhotos = useMemo(
    () => flashPhotos.map((photo) => toLightboxPhoto(photo, artist)),
    [flashPhotos, artist],
  )

  return (
    <section className={styles.artist_gallery_section}>
      <h2>Works</h2>
      <div className={styles.tabs}>
        <input
          type='radio'
          name='tattoos_tab'
          id={styles.tattoos_tab}
          defaultChecked
          className={styles.tab_input}
        />
        <label htmlFor={styles.tattoos_tab} className={styles.tab_label}>Tatuiruotės</label>
        <input
          type='radio'
          name='tattoos_tab'
          id={styles.flashdesigns_tab}
          className={styles.tab_input}
        />
        <label htmlFor={styles.flashdesigns_tab} className={styles.tab_label}>Laisvi eskizai</label>

        <div className={styles.tab_panels}>
          {/* The visitor is already on this artist's page, so the lightbox's
              "visit artist" button would be a no-op — hence showArtistLink
              is off here but on for the mixed-artist galleries. */}
          <Lightbox
            photos={tattooLightboxPhotos}
            labels={labels}
            showArtistLink={false}
          >
            <div className={styles.tab_panel} id={styles.tattoo_panel}>
              {tattooPhotos.map((photo) => (
                <PortfolioTile key={photo.id} photo={photo} />
              ))}
            </div>
          </Lightbox>
          <Lightbox
            photos={flashLightboxPhotos}
            labels={labels}
            showArtistLink={false}
          >
            <div className={styles.tab_panel} id={styles.flashdesign_panel}>
              {flashPhotos.map((photo) => (
                <PortfolioTile key={photo.id} photo={photo} />
              ))}
            </div>
          </Lightbox>
        </div>
      </div>
    </section>
  )
}
