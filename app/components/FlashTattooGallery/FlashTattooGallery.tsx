import { useMemo } from 'react'
import { buildPortfolioImageAttributes } from "~/lib/media/portfolioImageAttributes";
import { Lightbox, LightboxTrigger } from '~/components/Lightbox/Lightbox'
import type { LightboxLabels, LightboxPhoto } from '~/components/Lightbox/lightboxPhoto'
import styles from './FlashTattooGallery.module.css'

export type FlashGalleryPhoto = {
  photoId: number
  objectKey: string
  width: number
  height: number
  artistDisplayName: string
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