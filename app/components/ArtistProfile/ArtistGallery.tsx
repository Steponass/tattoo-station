import styles from './ArtistGallery.module.css'

interface GalleryPhoto {
  id: string
  url: string
  alt: string
  width: number
  height: number
}

const TATTOO_IMAGE_COUNT = 20
const FLASH_IMAGE_COUNT = 16

const tattooPhotos: GalleryPhoto[] = Array.from(
  { length: TATTOO_IMAGE_COUNT },
  (_, index) => {
    const fileNumber = String(index + 1).padStart(3, '0')
    return {
      id: `raimundas-tattoo-${fileNumber}`,
      url: `/artist_works/Raimundas/tattoo/RaimundasTattoo${fileNumber}.webp`,
      alt: `Raimundas tattoo ${index + 1}`,
      width: 600,
      height: 600,
    }
  },
)

const flashPhotos: GalleryPhoto[] = Array.from(
  { length: FLASH_IMAGE_COUNT },
  (_, index) => {
    const fileNumber = String(index + 1).padStart(3, '0')
    return {
      id: `raimundas-flash-${fileNumber}`,
      url: `/artist_works/Raimundas/flash/flash-test/RaimundasFlash${fileNumber}.webp`,
      alt: `Raimundas flash design ${index + 1}`,
      width: 600,
      height: 600,
    }
  },
)

export default function ArtistGallery() {
  const tiles = tattooPhotos
  const flashTiles = flashPhotos

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
            {tiles.map((photo) => (
              <div className={styles.artist_image_wrapper}>
              <img
                key={photo.id}
                src={photo.url}
                alt={photo.alt}
                width={photo.width}
                height={photo.height}
                className={styles.artist_image}
              />
              </div>
            ))}
          </div>
          <div className={styles.tab_panel} id={styles.flashdesign_panel}>
            {flashTiles.map((photo) => (
              <div className={styles.artist_image_wrapper}>
              <img
                key={photo.id}
                src={photo.url}
                alt={photo.alt}
                width={photo.width}
                height={photo.height}
                className={styles.artist_image}
              />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}