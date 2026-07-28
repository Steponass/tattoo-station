import { useRef, type MouseEvent } from "react";
import { Link } from "react-router";
import type { RosterArtist, RosterCopy } from "~/data/roster.types";
import { buildArtistProfilePath, resolveLocalizedContent } from "~/data/roster.format";
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
  buttonText: string,
  onDisclosureSettled?: () => void;
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
  const bioExcerpt = resolveLocalizedContent(artist.bioExcerpt, locale);

  function handleSummaryClick(event: MouseEvent<HTMLElement>) {
    // Suppress the native toggle so the WAAPI animation owns the open state.
    event.preventDefault();
    toggleAccordion();
  }

  return (
    <div className={styles.roster_item_wrapper}>
      <details className={styles.roster_item} ref={detailsRef}>
        <summary className={styles.roster_summary} onClick={handleSummaryClick}>
          <RosterNumber position={position} />

          <img
            className={styles.roster_avatar}
            src={artist.avatar.url}
            alt=""
            width={artist.avatar.width}
            height={artist.avatar.height}
            loading="lazy"
          />

          <span className={styles.roster_identity}>
            <h4 className={styles.roster_name}>{artist.name}</h4>
            <span className={styles.roster_styles}>{stylesLabel}</span>
          </span>
        </summary>

        {/* Wrapper is the animated element and must stay padding-free. */}
        <div className={styles.roster_panel_wrapper} ref={panelWrapperRef}>
          <div className={styles.roster_panel}>
            <p className={styles.roster_excerpt}>
              <Link
                to={`${profilePath}#bio`}
                className={styles.roster_excerpt_link}
              >
                {bioExcerpt}
              </Link>
            </p>
            <RosterPreviewGrid photos={artist.previewPhotos} />
            <NavButton to={`/artists/${artist.slug}`} buttonText={buttonText}/>
          </div>
        </div>
      </details>
    </div>
  );
}
