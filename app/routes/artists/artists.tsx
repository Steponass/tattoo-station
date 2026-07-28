
import { findActiveArtistsForRoster } from "~/lib/artists/artistRepository.server";
import { useIntlayer, useLocale } from "react-intlayer";
import { getDatabase } from "~/lib/cloudflare/cloudflareContext";
import { FALLBACK_LOCALE } from "~/lib/artists/artistTypes";
import type { Route } from "./+types/artists";
import Roster from "~/components/ArtistRoster/Roster";
import { mockRosterArtists } from '~/data/roster.mock';

export async function loader({ context }: Route.LoaderArgs) {
  const artists = await findActiveArtistsForRoster({
    database: getDatabase(context),
    locale: FALLBACK_LOCALE,
  });

  return { artists };
}

export default function ArtistsRoute({ loaderData }: Route.ComponentProps) {
  const { artists } = loaderData;
  const { viewFullProfileLabel, stylesSeparator } = useIntlayer("roster");
  const { locale } = useLocale();
  const { buttonTextViewMore } = useIntlayer("artists");

  return (
    <main>
      <h1>Artists</h1>
      <ul>
        {artists.map((artist) => (
          <li key={artist.id}>
            <h2>{artist.displayName}</h2>
            <p>{artist.role}</p>
            <p>{artist.bioExcerpt}</p>
          </li>
        ))}
      </ul>
          <Roster
            artists={mockRosterArtists}
            copy={{
              viewFullProfileLabel: viewFullProfileLabel.value,
              stylesSeparator: stylesSeparator.value,
            }}
            locale={locale}
            buttonText={buttonTextViewMore}
          />
    </main>
  );
}