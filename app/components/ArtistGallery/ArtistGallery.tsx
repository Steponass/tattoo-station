import { useMemo } from 'react'
import { Lightbox, LightboxTrigger } from '~/components/Lightbox/Lightbox'
import type {
  LightboxArtistLink,
  LightboxLabels,
  LightboxPhoto,
} from '~/components/Lightbox/lightboxPhoto'
import { buildPortfolioImageAttributes } from '~/lib/media/portfolioImageAttributes'
import styles from './ArtistGallery.module.css'


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
  artist: LightboxArtistLink
  worksHeading: string
  tattoosTabLabel: string
  flashTabLabel: string
}

interface PortfolioTileProps {
  photo: PortfolioImage
}

const PORTFOLIO_TILE_SIZES = '(max-width: 720px) 100vw, 400px'

/*
 * Gallery images are decorative (no per-image alt, by decision), so alt is
 * intentionally empty. It´s not very realistic to expect
 * artist to name all their photos
*/
function PortfolioTile({ photo }: PortfolioTileProps) {
  const { src, srcSet, sizes } = buildPortfolioImageAttributes({
    objectKey: photo.objectKey,
    sizes: PORTFOLIO_TILE_SIZES,
  })

  return (
    <LightboxTrigger photoId={photo.id} className='gallery-image-wrapper'>
      <img
        src={src}
        srcSet={srcSet}
        sizes={sizes}
        alt=''
        width={photo.width}
        height={photo.height}
        className='gallery-image'
      />
    </LightboxTrigger>
  )
}

/*
 * The tabs hold two independent photo sets, so each panel gets its own
 * <Lightbox> rather than one shared across both.
 */
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

export default function ArtistGallery({
  tattooPhotos,
  flashPhotos,
  labels,
  artist,
  worksHeading,
  tattoosTabLabel,
  flashTabLabel,
}: ArtistGalleryProps) {
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
      <h2>{worksHeading}</h2>
      <div className={styles.tabs}>
        <input
          type='radio'
          name='tattoos_tab'
          id={styles.tattoos_tab}
          defaultChecked
          className={styles.tab_input}
        />
        <label htmlFor={styles.tattoos_tab} className={styles.tab_label}>{tattoosTabLabel}</label>
        <input
          type='radio'
          name='tattoos_tab'
          id={styles.flashdesigns_tab}
          className={styles.tab_input}
        />
        <label htmlFor={styles.flashdesigns_tab} className={styles.tab_label}>{flashTabLabel}</label>

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
