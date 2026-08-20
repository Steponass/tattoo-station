import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { flushSync } from "react-dom";
import type { To } from "react-router";
import type { LightboxLabels, LightboxPhoto } from "./lightboxPhoto";
import { useLightboxState } from "./useLightboxState";
import { useSwipeNavigation } from "./useSwipeNavigation";
import { buildPortfolioImageAttributes } from "~/lib/media/portfolioImageAttributes";
import { LocalizedLink } from "~/components/intlayer/LocalizedLink";
import styles from "./Lightbox.module.css";

/* ---------------------------
/* Context
/* -------------------------*/

interface LightboxContextValue {
  open: (photoId: LightboxPhoto["id"], morphSource: HTMLElement | null) => void;
}

const LightboxContext = createContext<LightboxContextValue | null>(null);

const useLightboxContext = (): LightboxContextValue => {
  const contextValue = useContext(LightboxContext);

  if (contextValue === null) {
    throw new Error(
      "LightboxTrigger must be rendered inside a <Lightbox>. " +
        "Wrap the gallery's tiles with <Lightbox photos=... labels=...>.",
    );
  }

  return contextValue;
};

/**
 * The view-transition-name assigned to the hero during the open morph.
 * Matches the value assigned inline on the clicked trigger, so the
 * browser can pair the two snapshots and animate between them.
 */
const buildOpenMorphName = (photoId: LightboxPhoto["id"]): string => {
  return `photo-${photoId}`;
};

/**
 * The view-transition-name assigned to the hero once the open morph is
 * complete. Stable across prev/next navigations so both snapshots (old
 * photo, new photo) share it to make the cross-fade work.
 *
 * Kept as a distinct constant (not derived from the photo id) precisely
 * because it needs to be stable across photo changes.
 */
const STEADY_HERO_NAME = "lightbox-hero";

const startInPageViewTransition = (updateDom: () => void): ViewTransition => {
  const root = document.documentElement;
  root.dataset.viewTransition = "in-page";

  const transition = document.startViewTransition(updateDom);

  transition.finished
    .catch(() => {
      // Interrupted by another transition — the marker still has to go.
    })
    .finally(() => {
      delete root.dataset.viewTransition;
    });

  return transition;
};

/**
 * True when the current environment supports the View Transitions API
 * AND the visitor has not asked for reduced motion.
 */
const canUseViewTransitions = (): boolean => {
  if (typeof document === "undefined") {
    return false;
  }
  if (typeof document.startViewTransition !== "function") {
    return false;
  }
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return false;
  }
  return true;
};

/* ---------------------------- */
/* Lightbox — provider + dialog 
/* ---------------------------- */

interface LightboxProps {
  photos: readonly LightboxPhoto[];
  labels: LightboxLabels;
  showArtistLink?: boolean;
  children: ReactNode;
}

const LIGHTBOX_HERO_SIZES = "100vw";

/*
 * Wraps a gallery. Renders its `children` as-is (so gallery layout is
 * untouched) and mounts a single `<dialog>` alongside them. Each
 * `LightboxTrigger` inside `children` reads the shared context to open
 * that dialog.
 *
 * State (including hash sync) lives in `useLightboxState`.
 */
export function Lightbox(props: LightboxProps) {
  const { photos, labels, showArtistLink = true, children } = props;

  const {
    currentPhoto,
    currentPhotoId,
    hasPrevious,
    hasNext,
    open,
    close,
    goToPrevious,
    goToNext,
  } = useLightboxState({ photos });

  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const triggerElementRef = useRef<HTMLElement | null>(null);

  /*
   * The name we want on the hero image. Two lifecycle phases:
   *
   *   - `openMorph` — hero mounts with `photo-<id>` to match the
   *     clicked trigger, then swaps to steady after the transition
   *     finishes. Set at open time.
   *   - `steady` — hero uses `lightbox-hero` so prev/next transitions
   *     have a stable name in both snapshots.
   *
   */
  const [heroNamePhase, setHeroNamePhase] = useState<"openMorph" | "steady">(
    "steady",
  );

  /* ---------- Open with View Transition ----------- */

  const openWithTransition = useCallback(
    (photoId: LightboxPhoto["id"], morphSource: HTMLElement | null) => {
      triggerElementRef.current =
        document.activeElement instanceof HTMLElement
          ? document.activeElement
          : null;

      const shouldMorph = canUseViewTransitions() && morphSource !== null;

      if (!shouldMorph) {
        setHeroNamePhase("steady");
        open(photoId);
        return;
      }

      const openMorphName = buildOpenMorphName(photoId);
      morphSource.style.viewTransitionName = openMorphName;

      const transition = startInPageViewTransition(() => {
        flushSync(() => {
          // Clear the trigger's name AND set the hero to "openMorph"
          // phase so it renders with photo-<id>. Both DOM updates land
          // in the same commit: the new snapshot has photo-<id> on
          // exactly one element (the hero), matching the "old"
          // snapshot's single owner (the trigger).
          morphSource.style.viewTransitionName = "";
          setHeroNamePhase("openMorph");
          open(photoId);
        });
      });

      transition.finished
        .catch(() => {
          // Interrupted by another transition — cleanup still runs.
        })
        .finally(() => {
          setHeroNamePhase("steady");
        });
    },
    [open],
  );

  /* ------ Prev/next with View Transition ------ */

  const goToPreviousWithTransition = useCallback(() => {
    if (!canUseViewTransitions()) {
      goToPrevious();
      return;
    }
    document.documentElement.style.setProperty(
      "--lightbox-nav-direction",
      "-1",
    );
    startInPageViewTransition(() => {
      flushSync(() => {
        goToPrevious();
      });
    });
  }, [goToPrevious]);

  const goToNextWithTransition = useCallback(() => {
    if (!canUseViewTransitions()) {
      goToNext();
      return;
    }
    document.documentElement.style.setProperty("--lightbox-nav-direction", "1");
    startInPageViewTransition(() => {
      flushSync(() => {
        goToNext();
      });
    });
  }, [goToNext]);

  const contextValue = useMemo<LightboxContextValue>(
    () => ({ open: openWithTransition }),
    [openWithTransition],
  );

  const swipeHandlers = useSwipeNavigation({
    onPrevious: goToPreviousWithTransition,
    onNext: goToNextWithTransition,
    hasPrevious,
    hasNext,
  });

  /* ------------------ Dialog element imperative sync ------------------ */

  // Effect: open the dialog when a photo is selected.
  //
  // useLayoutEffect (not useEffect) because the View Transition on open
  // takes its "after" snapshot immediately after the flushSync callback
  // returns — and the hero image's view-transition-name lives inside
  // the <dialog>. If the dialog is still `display: none` at snapshot
  // time, the browser sees no matching element with that name and the
  // morph falls through as instant.
  useLayoutEffect(() => {
    const dialogElement = dialogRef.current;
    if (dialogElement === null) {
      return;
    }
    if (currentPhotoId === null) {
      return;
    }
    if (dialogElement.open) {
      return;
    }
    dialogElement.showModal();
  }, [currentPhotoId]);

  // Effect: close the dialog when the photo is cleared, and restore focus
  // to the trigger that opened it.
  useEffect(() => {
    const dialogElement = dialogRef.current;
    if (dialogElement === null) {
      return;
    }
    if (currentPhotoId !== null) {
      return;
    }
    if (!dialogElement.open) {
      return;
    }
    dialogElement.close();

    const triggerElement = triggerElementRef.current;
    if (triggerElement !== null && document.body.contains(triggerElement)) {
      triggerElement.focus();
    }
    triggerElementRef.current = null;
  }, [currentPhotoId]);

  /* ------- Native cancel → close ----- */
  useEffect(() => {
    const dialogElement = dialogRef.current;
    if (dialogElement === null) {
      return;
    }
    const handleCancel = () => {
      close();
    };
    dialogElement.addEventListener("cancel", handleCancel);
    return () => {
      dialogElement.removeEventListener("cancel", handleCancel);
    };
  }, [close]);

  /* -------- Arrow-key navigation ----- */
  useEffect(() => {
    if (currentPhotoId === null) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        goToPreviousWithTransition();
        return;
      }
      if (event.key === "ArrowRight") {
        event.preventDefault();
        goToNextWithTransition();
        return;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [currentPhotoId, goToPreviousWithTransition, goToNextWithTransition]);

  return (
    <LightboxContext.Provider value={contextValue}>
      {children}
      <dialog ref={dialogRef} className={styles.dialog}>
        {currentPhoto === null ? null : (
          <LightboxContents
            photo={currentPhoto}
            heroNamePhase={heroNamePhase}
            labels={labels}
            showArtistLink={showArtistLink}
            hasPrevious={hasPrevious}
            hasNext={hasNext}
            onPrevious={goToPreviousWithTransition}
            onNext={goToNextWithTransition}
            onClose={close}
            swipeHandlers={swipeHandlers}
          />
        )}
      </dialog>
    </LightboxContext.Provider>
  );
}

  /* -------------------- */
 /* Lightbox contents   */
/* -------------------*/

interface LightboxContentsProps {
  photo: LightboxPhoto;
  heroNamePhase: "openMorph" | "steady";
  labels: LightboxLabels;
  showArtistLink: boolean;
  hasPrevious: boolean;
  hasNext: boolean;
  onPrevious: () => void;
  onNext: () => void;
  onClose: () => void;
  swipeHandlers: ReturnType<typeof useSwipeNavigation>;
}

/**
 * The dialog's inner surface. Separated from `Lightbox` so the dialog
 * subtree fully unmounts when no photo is selected — that keeps the
 * `<img>` from holding a stale src while the dialog is closed and
 * prevents an off-screen decode of the previous photo.
 */
function LightboxContents(props: LightboxContentsProps) {
  const {
    photo,
    heroNamePhase,
    labels,
    showArtistLink,
    hasPrevious,
    hasNext,
    onPrevious,
    onNext,
    onClose,
    swipeHandlers,
  } = props;

  const shouldShowArtistLink = showArtistLink && photo.artist !== undefined;

  const bookingTo = buildBookingTo(photo);

  const heroTransitionName =
    heroNamePhase === "openMorph"
      ? buildOpenMorphName(photo.id)
      : STEADY_HERO_NAME;

  const heroStyle: CSSProperties = {
    viewTransitionName: heroTransitionName,
  };

  const heroImageAttributes = buildPortfolioImageAttributes({
    objectKey: photo.objectKey,
    sizes: LIGHTBOX_HERO_SIZES,
  });

  return (
    <div className={styles.contents} {...swipeHandlers}>
      <button
        type="button"
        onClick={onClose}
        aria-label={labels.close}
        className={styles.closeButton}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="3em"
          height="3em"
          viewBox="0 0 24 24"
        >
          <path
            fill="currentColor"
            d="M22.5 7.65L16.35 1.5h-8.7L1.5 7.65v8.699l6.15 6.15h8.7l6.15-6.15zm-5.904 1.168L13.414 12l3.182 3.181l-1.415 1.415L12 13.414l-3.182 3.182l-1.415-1.414L10.586 12L7.403 8.817l1.415-1.414L12 10.585l3.182-3.181z"
          />
        </svg>
      </button>

      <button
        type="button"
        onClick={onPrevious}
        disabled={!hasPrevious}
        aria-label={labels.previous}
        className={styles.previousButton}
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
          <path
            fill="currentColor"
            d="M513 216.6H158.5L316.1 59.1H197.9L1 256l196.9 196.9h118.2L158.5 295.4H513z"
          />
        </svg>
      </button>

      <img
        src={heroImageAttributes.src}
        srcSet={heroImageAttributes.srcSet}
        sizes={heroImageAttributes.sizes}
        alt={photo.alt ?? ""}
        width={photo.width}
        height={photo.height}
        className={styles.hero}
        style={heroStyle}
      />

      <button
        type="button"
        onClick={onNext}
        disabled={!hasNext}
        aria-label={labels.next}
        className={styles.nextButton}
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
          <path
            fill="currentColor"
            d="M513 216.6H158.5L316.1 59.1H197.9L1 256l196.9 196.9h118.2L158.5 295.4H513z"
          />
        </svg>
      </button>

      <footer className={styles.footer}>
        {shouldShowArtistLink && photo.artist !== undefined ? (
          <LocalizedLink
            key={`artist-${photo.id}`}
            to={`/artists/${photo.artist.slug}`}
            className={`${styles.artist_link} button_a chamfer chamfer-xs punch`}
          >
            {photo.artist.displayName}
          </LocalizedLink>
        ) : null}
        {/* Disabled for now: TBD if really needed as it clutters the lightbox */}
        {/* <LocalizedLink
          key={`booknow-${photo.id}`}
          to={bookingTo}
          className={`${styles.booknow_link} shadow chamfer chamfer-xs punch`}
        >
          {labels.bookNow}
        </LocalizedLink> */}
      </footer>
    </div>
  );
}

/*
 * Prefill the booking form's artist field 
  when we know whose photo it is
 */
function buildBookingTo(photo: LightboxPhoto): To {
  if (photo.artist === undefined) {
    return { pathname: "/booking" };
  }
  return {
    pathname: "/booking",
    search: `?artist=${encodeURIComponent(photo.artist.slug)}`,
  };
}

/* --------------------------- */
/* LightboxTrigger            */
/* ------------------------ */

interface LightboxTriggerProps {
  photoId: LightboxPhoto["id"];
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  ariaLabel?: string;
}

/*
 * Wraps a gallery tile and turns it into an open-lightbox control.
 *
 */
export function LightboxTrigger(props: LightboxTriggerProps) {
  const { photoId, children, className, style, ariaLabel } = props;
  const { open } = useLightboxContext();
  const buttonRef = useRef<HTMLButtonElement | null>(null);

  const handleClick = () => {
    open(photoId, buttonRef.current);
  };

  return (
    <button
      ref={buttonRef}
      type="button"
      onClick={handleClick}
      className={`${styles.trigger} ${className ?? ""}`.trim()}
      style={style}
      aria-label={ariaLabel}
    >
      {children}
    </button>
  );
}