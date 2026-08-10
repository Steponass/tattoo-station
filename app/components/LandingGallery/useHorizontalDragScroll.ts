// app/components/LandingGallery/useHorizontalDragScroll.ts

import { useRef, type PointerEvent as ReactPointerEvent } from "react";

/**
 * Below this drag distance (px), the gesture's direction hasn't been
 * determined yet — wait for more movement before locking to an axis.
 */
const DIRECTION_LOCK_THRESHOLD_PX = 10;

interface DragState {
  pointerId: number;
  startX: number;
  startY: number;
  startScrollLeft: number;
  axis: "horizontal" | "vertical" | null;
}

interface HorizontalDragScrollHandlers {
  onPointerDown: (event: ReactPointerEvent<HTMLElement>) => void;
  onPointerMove: (event: ReactPointerEvent<HTMLElement>) => void;
  onPointerUp: (event: ReactPointerEvent<HTMLElement>) => void;
  onPointerCancel: (event: ReactPointerEvent<HTMLElement>) => void;
}

/**
 * Drag-to-scroll for a horizontally-overflowing row, driven by JS rather
 * than native touch panning.
 *
 * The row's CSS declares `touch-action: pan-y`, not `pan-x` — on iOS
 * Safari, a scrollable element with both axes enabled (`pan-x pan-y`, or
 * `auto`) hits a WebKit bug where a touch drag detaches the image and
 * moves it around instead of scrolling the row. Declaring only `pan-y`
 * avoids that combination: vertical gestures are left to the browser so
 * the page can still scroll past a full-height gallery, and horizontal
 * gestures are left undeclared, so the browser hands them to us instead
 * of trying to pan the row natively. Same split as Lightbox's
 * useSwipeNavigation, just driving a live scroll position instead of a
 * single prev/next decision.
 *
 * Direction locks on the first ~10px of movement: more vertical, and we
 * back off so the page scrolls; more horizontal, and we take over
 * `scrollLeft` for the rest of the gesture.
 */
export function useHorizontalDragScroll(): HorizontalDragScrollHandlers {
  const dragRef = useRef<DragState | null>(null);

  const onPointerDown = (event: ReactPointerEvent<HTMLElement>) => {
    if (event.pointerType !== "touch" || !event.isPrimary) {
      return;
    }
    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      startScrollLeft: event.currentTarget.scrollLeft,
      axis: null,
    };
  };

  const onPointerMove = (event: ReactPointerEvent<HTMLElement>) => {
    const drag = dragRef.current;
    if (drag === null || drag.pointerId !== event.pointerId) {
      return;
    }

    const deltaX = event.clientX - drag.startX;

    if (drag.axis === null) {
      const deltaY = event.clientY - drag.startY;
      if (
        Math.abs(deltaX) < DIRECTION_LOCK_THRESHOLD_PX &&
        Math.abs(deltaY) < DIRECTION_LOCK_THRESHOLD_PX
      ) {
        return;
      }
      drag.axis = Math.abs(deltaX) > Math.abs(deltaY) ? "horizontal" : "vertical";
      if (drag.axis === "horizontal") {
        event.currentTarget.setPointerCapture(event.pointerId);
      }
    }

    if (drag.axis !== "horizontal") {
      return;
    }
    event.preventDefault();
    event.currentTarget.scrollLeft = drag.startScrollLeft - deltaX;
  };

  const endDrag = (event: ReactPointerEvent<HTMLElement>) => {
    const drag = dragRef.current;
    if (drag !== null && drag.pointerId === event.pointerId) {
      dragRef.current = null;
    }
  };

  return {
    onPointerDown,
    onPointerMove,
    onPointerUp: endDrag,
    onPointerCancel: endDrag,
  };
}
