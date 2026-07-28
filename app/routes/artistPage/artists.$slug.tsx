import { Locales, validatePrefix } from "intlayer";
import { data } from "react-router";
import type { Route } from "./+types/artists.$slug";
import { LocalizedLink } from "~/components/intlayer/LocalizedLink";
import { mockRosterArtists } from "~/data/roster.mock";
import { resolveLocalizedContent } from "~/data/roster.format";
import styles from "./artist.page.module.css";
import ArtistGallery from "~/components/ArtistProfile/ArtistGallery";

// TODO: swap this lookup for a D1 query once the artists table exists.
export const loader = ({ params }: Route.LoaderArgs) => {
  const { lang, slug } = params;

  const { isValid } = validatePrefix(lang);

  if (!isValid) {
    throw data("Locale not supported", { status: 404 });
  }

  const locale = lang ?? Locales.LITHUANIAN;

  const artist = mockRosterArtists.find((candidate) => candidate.slug === slug);

  if (!artist) {
    throw data("Artist not found", { status: 404 });
  }

  return { artist, locale };
};

export const meta: Route.MetaFunction = ({ loaderData }) => {
  if (!loaderData) return [];

  const { artist, locale } = loaderData;

  return [
    { title: artist.name },
    {
      name: "description",
      content: resolveLocalizedContent(artist.bioExcerpt, locale),
    },
  ];
};

export default function ArtistProfileRoute({
  loaderData,
}: Route.ComponentProps) {
  const { artist, locale } = loaderData;
  const stylesLabel = artist.styles.join(" · ");
  const bioExcerpt = resolveLocalizedContent(artist.bioExcerpt, locale);

  return (
    <main>
      <section className={styles.artist_section}>
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
            <p>{stylesLabel}</p>
            <p>{bioExcerpt}</p>
          </div>
        </article>
        <ArtistGallery />
        <div className={styles.bottom_nav}>
          <LocalizedLink to="/artists">Meistrai</LocalizedLink>
          <LocalizedLink to="/booking">Rezervuoti</LocalizedLink>
        </div>
      </section>
    </main>
  );
}
