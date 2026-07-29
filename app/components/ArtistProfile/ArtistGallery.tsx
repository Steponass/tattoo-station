import styles from './ArtistGallery.module.css'

/**
 * A single portfolio image ready to render: a delivery URL plus the stored
 * dimensions, so each tile reserves layout space before the image loads.
 */
export interface PortfolioImage {
  id: number
  src: string
  width: number
  height: number
}

interface ArtistGalleryProps {
  tattooPhotos: PortfolioImage[]
  flashPhotos: PortfolioImage[]
}

interface PortfolioTileProps {
  photo: PortfolioImage
}

/** Gallery images are decorative (no per-image alt, by decision), so alt is
 * intentionally empty. */
function PortfolioTile({ photo }: PortfolioTileProps) {
  return (
    <div className={styles.artist_image_wrapper}>
      <img
        src={photo.src}
        alt=""
        width={photo.width}
        height={photo.height}
        className={styles.artist_image}
      />
    </div>
  )
}

export default function ArtistGallery({ tattooPhotos, flashPhotos }: ArtistGalleryProps) {
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
          <div className={styles.tab_panel} id={styles.tattoo_panel}>
            {tattooPhotos.map((photo) => (
              <PortfolioTile key={photo.id} photo={photo} />
            ))}
          </div>
          <div className={styles.tab_panel} id={styles.flashdesign_panel}>
            {flashPhotos.map((photo) => (
              <PortfolioTile key={photo.id} photo={photo} />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}