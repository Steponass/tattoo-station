import { useCallback, useEffect, useMemo, useState } from "react";
import type { LightboxPhoto } from "./lightboxPhoto";

/*
 * The public shape of the state machine.
 */
export interface LightboxState {
  currentPhotoId: LightboxPhoto["id"] | null;
  currentPhoto: LightboxPhoto | null;
  currentIndex: number;
  hasPrevious: boolean;
  hasNext: boolean;
  open: (photoId: LightboxPhoto["id"]) => void;
  close: () => void;
  goToPrevious: () => void;
  goToNext: () => void;
}

interface UseLightboxStateInput {
  photos: readonly LightboxPhoto[];
}


export function useLightboxState(input: UseLightboxStateInput): LightboxState {
  const { photos } = input;

  const [currentPhotoId, setCurrentPhotoId] = useState<
    LightboxPhoto["id"] | null
  >(null);

  const currentIndex = useMemo(() => {
    if (currentPhotoId === null) {
      return -1;
    }
    return photos.findIndex((photo) => photo.id === currentPhotoId);
  }, [photos, currentPhotoId]);

  const currentPhoto = useMemo(() => {
    if (currentIndex === -1) {
      return null;
    }
    return photos[currentIndex];
  }, [photos, currentIndex]);

  const hasPrevious = currentIndex > 0;
  const hasNext = currentIndex >= 0 && currentIndex < photos.length - 1;


  useEffect(() => {
    const hashPhotoId = readPhotoIdFromHash(window.location.hash, photos);
    if (hashPhotoId === null) {
      return;
    }
    setCurrentPhotoId(hashPhotoId);
  }, []);

  /* -------- Browser back/forward → state ------- */

  useEffect(() => {
    const handlePopState = () => {
      const hashPhotoId = readPhotoIdFromHash(window.location.hash, photos);
      setCurrentPhotoId(hashPhotoId);
    };
    window.addEventListener("popstate", handlePopState);
    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [photos]);

  /* ------------- Transitions -------------- */
  // Each transition updates React state AND writes the hash. The
  // combination is one atomic user action per callback — no race
  // between the two writes, because both happen synchronously in the
  // same event handler.

  const open = useCallback(
    (photoId: LightboxPhoto["id"]) => {
      setCurrentPhotoId(photoId);
      const url = `${window.location.pathname}${window.location.search}#${buildPhotoHashFragment(photoId)}`;
      window.history.pushState(null, "", url);
    },
    [],
  );

  const close = useCallback(() => {
    setCurrentPhotoId(null);
    if (window.location.hash.startsWith("#photo-")) {
      const url = `${window.location.pathname}${window.location.search}`;
      window.history.replaceState(null, "", url);
    }
  }, []);

  const goToPrevious = useCallback(() => {
    setCurrentPhotoId((existingPhotoId) => {
      if (existingPhotoId === null) {
        return existingPhotoId;
      }
      const existingIndex = photos.findIndex(
        (photo) => photo.id === existingPhotoId,
      );
      if (existingIndex <= 0) {
        return existingPhotoId;
      }
      const nextPhotoId = photos[existingIndex - 1].id;
      replacePhotoHash(nextPhotoId);
      return nextPhotoId;
    });
  }, [photos]);

  const goToNext = useCallback(() => {
    setCurrentPhotoId((existingPhotoId) => {
      if (existingPhotoId === null) {
        return existingPhotoId;
      }
      const existingIndex = photos.findIndex(
        (photo) => photo.id === existingPhotoId,
      );
      if (existingIndex < 0 || existingIndex >= photos.length - 1) {
        return existingPhotoId;
      }
      const nextPhotoId = photos[existingIndex + 1].id;
      replacePhotoHash(nextPhotoId);
      return nextPhotoId;
    });
  }, [photos]);

  return {
    currentPhotoId,
    currentPhoto,
    currentIndex,
    hasPrevious,
    hasNext,
    open,
    close,
    goToPrevious,
    goToNext,
  };
}

  /* -------------------- */
 /* Hash helpers        */
/* ------------------ */

const PHOTO_HASH_PREFIX = "photo-";

function buildPhotoHashFragment(photoId: LightboxPhoto["id"]): string {
  return `${PHOTO_HASH_PREFIX}${photoId}`;
}

function replacePhotoHash(photoId: LightboxPhoto["id"]): void {
  const url = `${window.location.pathname}${window.location.search}#${buildPhotoHashFragment(photoId)}`;
  window.history.replaceState(null, "", url);
}


function readPhotoIdFromHash(
  rawHash: string,
  photos: readonly LightboxPhoto[],
): LightboxPhoto["id"] | null {
  // rawHash starts with "#" when present, or is empty string when not.
  if (!rawHash.startsWith(`#${PHOTO_HASH_PREFIX}`)) {
    return null;
  }
  const idFragment = rawHash.slice(`#${PHOTO_HASH_PREFIX}`.length);
  if (idFragment.length === 0) {
    return null;
  }

  
  const stringMatch = photos.find((photo) => String(photo.id) === idFragment);
  if (stringMatch !== undefined) {
    return stringMatch.id;
  }
  return null;
}