import { buildPortfolioImageAttributes } from '~/lib/media/portfolioImageAttributes'
import { Lightbox, LightboxTrigger } from '~/components/Lightbox/Lightbox'
import type {
  LightboxLabels,
  LightboxPhoto,
} from '~/components/Lightbox/lightboxPhoto'
import styles from './StyleGallery.module.css'

const PLACEHOLDER_TILE_COUNT = 4
const STYLE_TILE_SIZES = '(max-width: 400px) 45vw, 164px'

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
        {photos.slice(0, 6).map((photo) => (
          <StyleGalleryTile key={photo.id} photo={photo} />
        ))}
      </div>
    </Lightbox>
  )
}

function StyleGalleryTile({ photo }: { photo: LightboxPhoto }) {
  const { src, srcSet, sizes } = buildPortfolioImageAttributes({
    objectKey: photo.objectKey,
    sizes: STYLE_TILE_SIZES,
  })

  return (
    <LightboxTrigger
      photoId={photo.id}
      className={`${styles.style_gallery_tile} gallery-image-wrapper`}
    >
      <img
        src={src}
        srcSet={srcSet}
        sizes={sizes}
        alt={photo.alt ?? ''}
        width={photo.width}
        height={photo.height}
        className='gallery-image'
        loading='lazy'
      />
    </LightboxTrigger>
  )
}
