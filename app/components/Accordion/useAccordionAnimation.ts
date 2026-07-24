import { useCallback, useEffect, useRef, type RefObject } from "react";

const DISCLOSURE_DURATION_MS = 200;
const DISCLOSURE_EASING = "ease-in";
const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

interface UseAccordionAnimationOptions {
  detailsRef: RefObject<HTMLDetailsElement | null>;
  panelRef: RefObject<HTMLElement | null>;
  onAnimationFinish?: () => void;
}


// As per https://ics.media/en/entry/220901/

/**
 * Returns a toggle handler that animates a <details> panel open/closed
 * using the Web Animations API. Must be called directly from the
 * summary's click handler (not from an effect reacting to some React
 * state) so the `open` mutation, height measurement, and animation start
 * all happen synchronously within the click. Routing this through a
 * isOpen-prop -> useEffect indirection let the browser paint the
 * fully-open state before the animation got a chance to start from 0, so
 * opening would just snap instead of animate; closing looked fine since
 * it only ever measures the already-settled open height, no fresh
 * mutation beforehand.
 *
 * Necessary because Safari (iOS included) still does not support
 * ::details-content or interpolate-size, so CSS-only height animation
 * silently degrades to an instant snap on a large share of target traffic.
 */
export function useAccordionAnimation({
  detailsRef,
  panelRef,
  onAnimationFinish,
}: UseAccordionAnimationOptions): () => void {
  const runningAnimationRef = useRef<Animation | null>(null);

  useEffect(() => {
    return () => {
      runningAnimationRef.current?.cancel();
    };
  }, []);

  return useCallback(() => {
    const detailsElement = detailsRef.current;
    const panelElement = panelRef.current;

    if (!detailsElement || !panelElement) {
      return;
    }

    // Cancelling mid-flight snaps the element to whatever height it was
    // at, which is exactly the value the reversed animation should start
    // from.
    runningAnimationRef.current?.cancel();
    runningAnimationRef.current = null;

    const wasOpen = detailsElement.open;
    const prefersReducedMotion = window.matchMedia(REDUCED_MOTION_QUERY).matches;

    if (prefersReducedMotion) {
      detailsElement.open = !wasOpen;
      onAnimationFinish?.();
      return;
    }

    const animationTiming: KeyframeAnimationOptions = {
      duration: DISCLOSURE_DURATION_MS,
      easing: DISCLOSURE_EASING,
    };

    if (wasOpen) {
      const closingAnimation = panelElement.animate(
        [
          { height: `${panelElement.offsetHeight}px`, opacity: 1 },
          { height: "0px", opacity: 0 },
        ],
        animationTiming,
      );

      runningAnimationRef.current = closingAnimation;
      closingAnimation.onfinish = () => {
        detailsElement.open = false;
        runningAnimationRef.current = null;
        onAnimationFinish?.();
      };

      return;
    }

    detailsElement.open = true;

    const openingAnimation = panelElement.animate(
      [
        { height: "0px", opacity: 0 },
        { height: `${panelElement.offsetHeight}px`, opacity: 1 },
      ],
      animationTiming,
    );

    runningAnimationRef.current = openingAnimation;
    openingAnimation.onfinish = () => {
      runningAnimationRef.current = null;
      onAnimationFinish?.();
    };
  }, [detailsRef, panelRef, onAnimationFinish]);
}
