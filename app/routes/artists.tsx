
import { findActiveArtistsForRoster } from "~/lib/artists/artistRepository.server";
import { getDatabase } from "~/lib/cloudflare/cloudflareContext";
import { FALLBACK_LOCALE } from "~/lib/artists/artistTypes";
import type { Route } from "./+types/artists";

export async function loader({ context }: Route.LoaderArgs) {
  const artists = await findActiveArtistsForRoster({
    database: getDatabase(context),
    locale: FALLBACK_LOCALE,
  });

  return { artists };
}

export default function ArtistsRoute({ loaderData }: Route.ComponentProps) {
  const { artists } = loaderData;

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
    </main>
  );
}