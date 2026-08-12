// app/components/Lightbox/useSwipeNavigation.ts

import { useRef, type PointerEvent as ReactPointerEvent } from "react";

/**
 * A horizontal drag shorter than this (in CSS px) is treated as a tap or
 * an imprecise touch, not a swipe.
 */
const SWIPE_MIN_DISTANCE_PX = 40;

/**
 * A drag whose vertical travel exceeds this is treated as a vertical
 * scroll/pan gesture rather than a prev/next swipe, even if it also moved
 * far enough horizontally.
 */
const SWIPE_MAX_OFF_AXIS_PX = 90;

interface UseSwipeNavigationInput {
  onPrevious: () => void;
  onNext: () => void;
  hasPrevious: boolean;
  hasNext: boolean;
}

interface SwipeNavigationHandlers {
  onPointerDown: (event: ReactPointerEvent<HTMLElement>) => void;
  onPointerUp: (event: ReactPointerEvent<HTMLElement>) => void;
  onPointerCancel: (event: ReactPointerEvent<HTMLElement>) => void;
}

interface SwipeStart {
  pointerId: number;
  x: number;
  y: number;
}

/**
 * Swipe-to-navigate for the Lightbox, built on the Pointer Events API —
 * the browser-native, unified way to handle touch (and pen/mouse) input
 * without reaching for a gesture library. Touch events fold into pointer
 * events, so this one listener set covers every pointer type; only
 * `pointerType === "touch"` triggers navigation, so mouse dragging/text
 * selection on desktop is untouched.
 *
 * Direction is resolved on `pointerup` from the recorded start point,
 * rather than tracked live on `pointermove` — the Lightbox only needs a
 * final decision (prev/next/neither), not a live-dragging visual, so
 * there's nothing for a move handler to do.
 *
 * Pairs with `touch-action: pan-y` on the swipeable element (see
 * Lightbox.module.css) so the browser leaves horizontal gestures to us
 * while still allowing vertical scrolling.
 */
export function useSwipeNavigation(
  input: UseSwipeNavigationInput,
): SwipeNavigationHandlers {
  const { onPrevious, onNext, hasPrevious, hasNext } = input;
  const startRef = useRef<SwipeStart | null>(null);

  const onPointerDown = (event: ReactPointerEvent<HTMLElement>) => {
    if (event.pointerType !== "touch" || !event.isPrimary) {
      return;
    }
    startRef.current = {
      pointerId: event.pointerId,
      x: event.clientX,
      y: event.clientY,
    };
    // Guarantees pointerup/cancel land on this element even if the
    // finger drifts outside its bounds mid-swipe.
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const endSwipe = (event: ReactPointerEvent<HTMLElement>) => {
    const start = startRef.current;
    startRef.current = null;
    if (start === null || start.pointerId !== event.pointerId) {
      return;
    }

    const deltaX = event.clientX - start.x;
    const deltaY = event.clientY - start.y;

    if (Math.abs(deltaY) > SWIPE_MAX_OFF_AXIS_PX) {
      return;
    }
    if (Math.abs(deltaX) < SWIPE_MIN_DISTANCE_PX) {
      return;
    }

    if (deltaX < 0) {
      if (hasNext) {
        onNext();
      }
      return;
    }
    if (hasPrevious) {
      onPrevious();
    }
  };

  const onPointerCancel = () => {
    startRef.current = null;
  };

  return {
    onPointerDown,
    onPointerUp: endSwipe,
    onPointerCancel,
  };
}
