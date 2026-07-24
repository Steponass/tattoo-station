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
    <main id={styles.main_piercing}>
      <div className={styles.piercing_table_and_profile}>
        <section className={styles.section_price}>
          <table id={styles.piercing_table}>
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
        <section className={styles.section_artist}>
          <article className={styles.artist_details}>
            <img
              src={artist.avatar.url}
              alt=""
              width={artist.avatar.width}
              height={artist.avatar.height}
              className={styles.artist_photo}
            />
            <div className={styles.artist_text}>
              <h1>{artist.name}</h1>
              {bioParagraphs.map((paragraph, index) => (
                <p key={index} className={styles.artist_bio_paragraph}>
                  {paragraph}
                </p>
              ))}
            </div>
          </article>
        </section>
      </div>
      <section className={styles.section_piercing_gallery}>
        <h1>{content.galleryHeading}</h1>
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
