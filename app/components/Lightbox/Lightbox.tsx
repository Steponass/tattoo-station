// app/components/Lightbox/Lightbox.tsx

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
import type { LightboxLabels, LightboxPhoto } from "./lightboxPhoto";
import { useLightboxState } from "./useLightboxState";
import styles from "./Lightbox.module.css";

/* -------------------------------------------------------------------------- */
/* Context                                                                    */
/* -------------------------------------------------------------------------- */

/**
 * The context is the single line of communication between a `Lightbox`
 * and the `LightboxTrigger`s nested inside it. The trigger doesn't know
 * where the lightbox lives in the tree or how it stores state — it just
 * calls `open(photoId, morphSource)`. The `morphSource` element is the
 * DOM node the View Transition should morph from; a null tells the
 * lightbox to skip the transition (used for deep links, since there's
 * no thumbnail on screen to morph from).
 */
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

/* -------------------------------------------------------------------------- */
/* View Transition helpers                                                    */
/* -------------------------------------------------------------------------- */

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
 * photo, new photo) share it — that's what makes the cross-fade work.
 *
 * Kept as a distinct constant (not derived from the photo id) precisely
 * because it needs to be stable across photo changes.
 */
const STEADY_HERO_NAME = "lightbox-hero";

/**
 * Starts a view transition that is *not* a navigation.
 *
 * The root snapshot is taken for every transition on the document, so
 * without a marker the page-level wipe in app/styles/page-transitions.css
 * would push the whole page sideways every time a photo opens or changes.
 * `data-view-transition` on <html> opts this transition out of that rule
 * (see the guard comment in page-transitions.css) and is cleared once the
 * transition settles, however it settles.
 */
const startInPageViewTransition = (
  updateDom: () => void,
): ViewTransition => {
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

/* -------------------------------------------------------------------------- */
/* Lightbox — provider + dialog                                               */
/* -------------------------------------------------------------------------- */

interface LightboxProps {
  photos: readonly LightboxPhoto[];
  labels: LightboxLabels;
  /**
   * When false, the artist-link button never renders, even if the current
   * photo carries an `artist`. Used on the artist profile page, where the
   * visitor is already on the artist's page.
   *
   * Defaults to true — the common case is a gallery that mixes artists.
   */
  showArtistLink?: boolean;
  children: ReactNode;
}

/**
 * Wraps a gallery. Renders its `children` as-is (so gallery layout is
 * untouched) and mounts a single `<dialog>` alongside them. Each
 * `LightboxTrigger` inside `children` reads the shared context to open
 * that dialog.
 *
 * State (including hash sync) lives in `useLightboxState`. This
 * component owns DOM concerns: the dialog element, focus restoration,
 * keyboard listeners, and View Transitions for both open and prev/next.
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

  /**
   * The name we want on the hero image. Two lifecycle phases:
   *
   *   - `openMorph` — hero mounts with `photo-<id>` to match the
   *     clicked trigger, then swaps to steady after the transition
   *     finishes. Set at open time.
   *   - `steady` — hero uses `lightbox-hero` so prev/next transitions
   *     have a stable name in both snapshots.
   *
   * Set here (in the provider) rather than inside LightboxContents so
   * openWithTransition can imperatively schedule the phase change via
   * the transition's `.finished` promise. Passed down to Contents as a
   * prop.
   */
  const [heroNamePhase, setHeroNamePhase] = useState<"openMorph" | "steady">(
    "steady",
  );

  /* --------------------- Open with View Transition -------------------- */
  // The morph runs by:
  //   1. Assigning `view-transition-name: photo-<id>` to the clicked
  //      trigger's morph target (the image, typically).
  //   2. Calling document.startViewTransition, which snapshots the DOM.
  //   3. Inside the callback, flushSync BOTH the trigger name-clear
  //      AND the state update. The dialog mounts with the hero using
  //      `photo-<id>` (because heroNamePhase is set to "openMorph"), so
  //      the "new" snapshot has exactly one element with that name.
  //   4. Once the transition's `.finished` promise resolves, swap the
  //      hero to the steady name so subsequent prev/next transitions
  //      can pair snapshots across photo changes.
  //
  // On environments without View Transitions or with reduced motion,
  // we skip the transition and go straight to steady — the dialog
  // opens instantly, prev/next also do instant swaps.
  const openWithTransition = useCallback(
    (
      photoId: LightboxPhoto["id"],
      morphSource: HTMLElement | null,
    ) => {
      triggerElementRef.current =
        document.activeElement instanceof HTMLElement
          ? document.activeElement
          : null;

      const shouldMorph =
        canUseViewTransitions() && morphSource !== null;

      if (!shouldMorph) {
        // No morph — hero mounts directly with the steady name.
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
          // in the same commit → the "new" snapshot has photo-<id> on
          // exactly one element (the hero), matching the "old"
          // snapshot's single owner (the trigger).
          morphSource.style.viewTransitionName = "";
          setHeroNamePhase("openMorph");
          open(photoId);
        });
      });

      // Once the open transition is done, switch the hero to the steady
      // name. This is not itself wrapped in a view transition — it's a
      // no-op visual change (the name is not a styled property, just an
      // identifier for future transitions).
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

  /* --------------- Prev/next with View Transition --------------------- */
  // Wrap each navigation so the browser cross-fades between the old and
  // new photo. Both snapshots share the steady hero name, so Chrome
  // pairs the two `<img>` renders across the src change and animates.
  //
  // The hero name is already "steady" at this point (openWithTransition
  // sets it after the open finishes, and any subsequent nav preserves
  // that phase). No name juggling needed here.
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
    };
        document.documentElement.style.setProperty(
      "--lightbox-nav-direction",
      "1",
    );
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

  /* ---------------------- Native cancel → close ----------------------- */
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

  /* --------------------- Arrow-key navigation ------------------------- */
  // Uses the *WithTransition variants so keyboard nav gets the same
  // cross-fade treatment as click nav — otherwise arrow keys would
  // instant-swap while buttons animate, which reads as inconsistent.
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
          />
        )}
      </dialog>
    </LightboxContext.Provider>
  );
}

/* -------------------------------------------------------------------------- */
/* Lightbox contents                                                          */
/* -------------------------------------------------------------------------- */

interface LightboxContentsProps {
  photo: LightboxPhoto;
  /**
   * Which view-transition-name to render on the hero:
   *   - "openMorph": use `photo-<id>` to match the clicked trigger.
   *     Only true during the open transition itself.
   *   - "steady":   use `lightbox-hero`, a stable name that lets
   *     prev/next transitions pair old and new snapshots.
   */
  heroNamePhase: "openMorph" | "steady";
  labels: LightboxLabels;
  showArtistLink: boolean;
  hasPrevious: boolean;
  hasNext: boolean;
  onPrevious: () => void;
  onNext: () => void;
  onClose: () => void;
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
  } = props;

  const shouldShowArtistLink =
    showArtistLink && photo.artist !== undefined;

  const bookingHref = buildBookingHref(photo);

  const heroTransitionName =
    heroNamePhase === "openMorph"
      ? buildOpenMorphName(photo.id)
      : STEADY_HERO_NAME;

  const heroStyle: CSSProperties = {
    viewTransitionName: heroTransitionName,
  };

  return (
    <div className={styles.contents}>
      <button
        type="button"
        onClick={onClose}
        aria-label={labels.close}
        className={styles.closeButton}
      >
        {"\u00D7"}
      </button>

      <button
        type="button"
        onClick={onPrevious}
        disabled={!hasPrevious}
        aria-label={labels.previous}
        className={styles.previousButton}
      >
        {"\u2190"}
      </button>

      <img
        src={photo.src}
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
        {"\u2192"}
      </button>

      <footer className={styles.footer}>
        {shouldShowArtistLink && photo.artist !== undefined ? (
          <a
            href={`/artists/${photo.artist.slug}`}
            className={styles.artistLink}
          >
            {labels.visitArtistPrefix} {photo.artist.displayName}
          </a>
        ) : (
          <span aria-hidden="true" className={styles.footerSpacer} />
        )}
        <a href={bookingHref} className={styles.bookNowLink}>
          {labels.bookNow}
        </a>
      </footer>
    </div>
  );
}

/**
 * Prefill the booking form's artist field when we know who made the
 * photo. The booking route reads `?artist=` and preselects the matching
 * option. When there's no artist context, we send the visitor to the
 * plain booking page and let them choose.
 */
function buildBookingHref(photo: LightboxPhoto): string {
  if (photo.artist === undefined) {
    return "/booking";
  }
  return `/booking?artist=${encodeURIComponent(photo.artist.slug)}`;
}

/* -------------------------------------------------------------------------- */
/* LightboxTrigger                                                            */
/* -------------------------------------------------------------------------- */

interface LightboxTriggerProps {
  photoId: LightboxPhoto["id"];
  children: ReactNode;
  className?: string;
}

/**
 * Wraps a gallery tile and turns it into an open-lightbox control.
 *
 * Renders a `<button type="button">`. Every consumer today wraps its
 * tiles in a link (`<LocalizedLink>` on the landing gallery, `<div>` on
 * others). This step replaces those wrappers with a proper button —
 * clicking is a control action ("open"), not a navigation.
 *
 * The button also serves as the morph source for the View Transition
 * on open. We pass the button's DOM node to `open()` so the lightbox
 * can tag it with a matching view-transition-name at click time and
 * clean up after. This means the whole tile morphs — background,
 * chamfer, and image together — which reads as one coherent shape
 * unfolding into the lightbox rather than just the image floating.
 */
export function LightboxTrigger(props: LightboxTriggerProps) {
  const { photoId, children, className } = props;
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
    >
      {children}
    </button>
  );
}