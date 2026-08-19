import { useRef, type PointerEvent as ReactPointerEvent } from "react";

const SWIPE_MIN_DISTANCE_PX = 40;
const SWIPE_MAX_OFF_AXIS_PX = 80;

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

  const onPointerCancel = (event: ReactPointerEvent<HTMLElement>) => {
    if (startRef.current?.pointerId === event.pointerId) {
      startRef.current = null;
    }
  };

  return {
    onPointerDown,
    onPointerUp: endSwipe,
    onPointerCancel,
  };
}
