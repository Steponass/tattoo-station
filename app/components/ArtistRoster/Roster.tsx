import type { RosterArtist, RosterCopy } from "~/data/roster.types";
import { formatRosterPosition } from "~/data/roster.format";
import RosterItem from "./RosterItem";
import styles from "./Roster.module.css";

interface RosterProps {
  artists: RosterArtist[];
  copy: RosterCopy;
  locale: string;
  buttonText: string;
  onDisclosureSettled?: () => void;
}

export default function Roster({
  artists,
  copy,
  locale,
  buttonText,
  onDisclosureSettled,
}: RosterProps) {
  return (
    <ol className={styles.roster}>
      {artists.map((artist, artistIndex) => (
        <li key={artist.id}>
          <RosterItem
            artist={artist}
            copy={copy}
            locale={locale}
            position={formatRosterPosition(artistIndex)}
            onDisclosureSettled={onDisclosureSettled}
            buttonText={buttonText}
          />
        </li>
      ))}
    </ol>
  );
}
