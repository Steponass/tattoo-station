import styles from './FlashTattooGallery.module.css'

interface GalleryPhoto {
  id: string
  url: string
  alt: string
  width: number
  height: number
}

const FLASH_IMAGE_COUNT = 48

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

export default function FlashTattooGallery() {

    const flashTiles = flashPhotos

  return (
    <section className={styles.flash_tattoo_gallery}>
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
    </section>
  )
}