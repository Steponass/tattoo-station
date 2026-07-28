import { getIntlayer, validatePrefix } from "intlayer";
import { useIntlayer, useLocale } from "react-intlayer";
import { data } from "react-router";
import type { Route } from "./+types/piercing";
import styles from "./piercing.module.css";
import { mockRosterArtists } from "~/data/roster.mock";
import Accordion from "~/components/Accordion/Accordion";

export const loader = ({ params }: Route.LoaderArgs) => {
  const { lang } = params;

  const { isValid } = validatePrefix(lang);

  if (!isValid) {
    throw data("Locale not supported", { status: 404 });
  }
};

export const meta: Route.MetaFunction = ({ params }) => {
  const content = getIntlayer("piercing", params.lang);

  return [
    { title: content.title },
    { content: content.description, name: "description" },
  ];
};

export const handle = {
  titleBoard: { 
    show: true, 
    labelKey: "piercing",
    timing: { characterStaggerSeconds: 0.03, minimumFlapCount: 10 },
 },
};


export default function piercing() {
  const content = useIntlayer("piercing");
  const { locale } = useLocale();
  const artist = mockRosterArtists.find((a) => a.slug === "joana")!;
  const bioParagraphs = artist.bio[locale].split("\n\n");

  const rows = [
    [content.piercingService1, content.piercingPrice1],
    [content.piercingService2, content.piercingPrice2],
    [content.piercingService3, content.piercingPrice3],
    [content.piercingService4, content.piercingPrice4],
    [content.piercingService5, content.piercingPrice5],
    [content.piercingService6, content.piercingPrice6],
    [content.piercingService7, content.piercingPrice7],
  ];

const { items: first_accordion } = useIntlayer("faq-piercing1");
const { items: second_accordion } = useIntlayer("faq-piercing2");

  interface GalleryPhoto {
    id: string;
    url: string;
    alt: string;
    width: number;
    height: number;
  }

  const PIERCING_IMAGE_COUNT = 12;

  const piercingPhotos: GalleryPhoto[] = Array.from(
    { length: PIERCING_IMAGE_COUNT },
    (_, index) => {
      const fileNumber = String(index + 1).padStart(3, "0");
      return {
        id: `raimundas-tattoo-${fileNumber}`,
        url: `/artist_works/Raimundas/tattoo/RaimundasTattoo${fileNumber}.webp`,
        alt: `Raimundas tattoo ${index + 1}`,
        width: 600,
        height: 600,
      };
    },
  );

  return (
    <main>
      <div className={styles.piercing_table_and_profile}>
        <section className={styles.section_price}>
          <table className={`${styles.piercing_table} chamfer-l`}>
            <thead>
              <tr>
                <th>{content.tableHeaderType}</th>
                <th>{content.tableHeaderPrice}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(([service, price], index) => (
                <tr key={index}>
                  <td>{service}</td>
                  <td>{price}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
          <div className={styles.artist_photo_and_name}>
            <img
              src='/Joana_Piercing_logo_transparent_bg_cropped.png'
              alt=""
              width={artist.avatar.width}
              height={artist.avatar.height}
              className={styles.artist_photo}
            />
            <h2>{artist.name}</h2>
          </div>
        <article className={styles.artist_text}>
          <img className={styles.piercing_jewelry_1} src="/Piercing_jewelry_1.webp">
            </img>
          {bioParagraphs.map((paragraph, index) => (
            <>
              {index === bioParagraphs.length - 1 && (
                <img
                  className={styles.piercing_jewelry_2}
                  src="/Piercing_jewelry_2.webp"
                />
              )}
              <p key={index} className={styles.artist_bio_paragraph}>
                {paragraph}
              </p>
            </>
          ))}
        </article>
      </div>
      <section className={styles.section_piercing_gallery}>
        <h2>{content.galleryHeading}</h2>
        <div className={styles.piercing_gallery_grid}>
          {piercingPhotos.map((photo) => (
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
      </section>
      <section className={styles.section_piercing_faq}>
        <Accordion items={first_accordion} />
        <Accordion items={second_accordion}/>
      </section>
    </main>
  );
}
