import { useRef, type MouseEvent } from "react";
import { Link } from "react-router";
import type {
  RosterArtist,
  RosterAvatar,
  RosterCopy,
} from "~/data/roster.types";
import { buildArtistProfilePath } from "~/data/roster.format";
import { useAccordionAnimation } from "~/components/Accordion/useAccordionAnimation";
import { RosterNumber } from "./RosterNumber";
import { RosterPreviewGrid } from "./RosterPreviewGrid";
import NavButton from "~/components/Button/NavButton";
import styles from "./Roster.module.css";

interface RosterItemProps {
  artist: RosterArtist;
  copy: RosterCopy;
  locale: string;
  position: string;
  buttonText: string;
  onDisclosureSettled?: () => void;
}

/** Renders nothing when the artist has no avatar yet; the summary's flex row
 *  simply closes the gap rather than reserving space for a missing image. */
function RosterAvatarImage({ avatar }: { avatar: RosterAvatar | null }) {
  if (avatar === null) {
    return null;
  }

  return (
    <img
      className={styles.roster_avatar}
      src={avatar.url}
      alt=""
      width={avatar.width}
      height={avatar.height}
      loading="lazy"
    />
  );
}

export default function RosterItem({
  artist,
  copy,
  locale,
  position,
  buttonText,
}: RosterItemProps) {
  const detailsRef = useRef<HTMLDetailsElement>(null);
  const panelWrapperRef = useRef<HTMLDivElement>(null);

  const toggleAccordion = useAccordionAnimation({
    detailsRef,
    panelRef: panelWrapperRef,
  });

  const profilePath = buildArtistProfilePath(locale, artist.slug);
  const stylesLabel = artist.styles.join(` ${copy.stylesSeparator} `);

  // The piercing artist's real page is /piercing — her bio, price list, and
  // gallery all live there rather than on the generic /artists/:slug
  // template — so her "see more" button skips that template entirely.
  const seeMorePath = artist.role === "piercing" ? "/piercing" : `/artists/${artist.slug}`;

  function handleSummaryClick(event: MouseEvent<HTMLElement>) {
    // Suppress the native toggle so the WAAPI animation owns the open state.
    event.preventDefault();
    toggleAccordion();
  }

  return (
    <div className={styles.roster_item_wrapper}>
      <details className={styles.roster_item} ref={detailsRef}>
        <summary className={styles.roster_summary} onClick={handleSummaryClick}>
          <div className={styles.roster_no_and_avatar_container}>
            <RosterNumber position={position} />

            <RosterAvatarImage avatar={artist.avatar} />
          </div>
          <div className={styles.roster_identity}>
            <h4 className={styles.roster_name}>{artist.name}</h4>
            <span className={styles.roster_styles}>{stylesLabel}</span>
          </div>
        </summary>

        {/* Wrapper is the animated element and must stay padding-free. */}
        <div className={styles.roster_panel_wrapper} ref={panelWrapperRef}>
          <div className={styles.roster_panel}>
            <p className={styles.roster_excerpt}>
              <Link
                to={`${profilePath}#bio`}
                className={styles.roster_excerpt_link}
                viewTransition
              >
                {artist.bioExcerpt}
              </Link>
            </p>
            <RosterPreviewGrid photos={artist.previewPhotos} />
            <NavButton to={seeMorePath} buttonText={buttonText} />
          </div>
        </div>
      </details>
    </div>
  );
}
