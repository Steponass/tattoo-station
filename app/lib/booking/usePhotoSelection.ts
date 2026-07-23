// app/lib/booking/usePhotoSelection.ts

import { useCallback, useEffect, useRef, useState } from "react";

import {
  MAX_PHOTOS_PER_BOOKING,
  validatePhotoSelection,
  type PhotoRejectionCode,
} from "./photoConstraints";
import {
  uploadBookingPhoto,
  type UploadedPhoto,
} from "./uploadBookingPhoto";

export type PhotoEntryStatus =
  | "uploading"
  | "uploaded"
  | "rejected"
  | "failed";

export type PhotoEntry = {
  entryId: string;
  file: File;
  fileName: string;
  fileSizeBytes: number;
  /** Object URL for the local preview. Revoked when the entry is removed. */
  previewUrl: string;
  status: PhotoEntryStatus;
  uploadedPhoto: UploadedPhoto | null;
  /** Set when the file failed client-side validation. */
  rejectionCode: PhotoRejectionCode | null;
  /** Set when the upload request itself failed. */
  failureDetail: string | null;
  abortController: AbortController;
};

function countEntriesOccupyingASlot(entries: PhotoEntry[]): number {
  return entries.filter((entry) => entry.status !== "rejected").length;
}

/**
 * Manages reference photo selection, validation, and upload.
 *
 * Uploads begin as soon as a file is chosen rather than on submit, so the work
 * overlaps with the time the customer spends filling in the rest of the form.
 * The submitted form carries only object keys.
 */
export function usePhotoSelection() {
  const [entries, setEntries] = useState<PhotoEntry[]>([]);

  /** Stable per-mount identifier scoping this submission's R2 prefix. */
  const draftIdRef = useRef<string>(crypto.randomUUID());

  /** Mirrors entries so unmount cleanup can reach the current list. */
  const entriesRef = useRef<PhotoEntry[]>(entries);

  useEffect(() => {
    entriesRef.current = entries;
  }, [entries]);

  useEffect(() => {
    return () => {
      for (const entry of entriesRef.current) {
        URL.revokeObjectURL(entry.previewUrl);
      }
    };
  }, []);

  useEffect(() => {
    return () => {
      for (const entry of entriesRef.current) {
        entry.abortController.abort();
      }
    };
  }, []);

  const applyEntryUpdate = useCallback(
    (entryId: string, update: Partial<PhotoEntry>) => {
      setEntries((currentEntries) =>
        currentEntries.map((entry) =>
          entry.entryId === entryId ? { ...entry, ...update } : entry,
        ),
      );
    },
    [],
  );

  const startUpload = useCallback(
    async (entry: PhotoEntry) => {
      try {
        const outcome = await uploadBookingPhoto({
          file: entry.file,
          draftId: draftIdRef.current,
          abortSignal: entry.abortController.signal,
        });

        if (outcome.ok) {
          applyEntryUpdate(entry.entryId, {
            status: "uploaded",
            uploadedPhoto: outcome.photo,
          });
          return;
        }

        applyEntryUpdate(entry.entryId, {
          status: "failed",
          failureDetail: outcome.detail,
        });
      } catch (error) {
        if (entry.abortController.signal.aborted) {
          return;
        }

        applyEntryUpdate(entry.entryId, {
          status: "failed",
          failureDetail:
            error instanceof Error ? error.message : String(error),
        });
      }
    },
    [applyEntryUpdate],
  );

  const addFiles = useCallback(
    (selectedFiles: File[]) => {
      const createdEntries: PhotoEntry[] = [];
      let projectedCount = countEntriesOccupyingASlot(entriesRef.current);

      for (const file of selectedFiles) {
        const validation = validatePhotoSelection({
          fileName: file.name,
          mimeType: file.type,
          fileSizeBytes: file.size,
          alreadySelectedCount: projectedCount,
        });

        const entry: PhotoEntry = {
          entryId: crypto.randomUUID(),
          file,
          fileName: file.name,
          fileSizeBytes: file.size,
          previewUrl: URL.createObjectURL(file),
          status: validation.accepted ? "uploading" : "rejected",
          uploadedPhoto: null,
          rejectionCode: validation.accepted ? null : validation.rejectionCode,
          failureDetail: null,
          abortController: new AbortController(),
        };

        createdEntries.push(entry);

        if (validation.accepted) {
          projectedCount += 1;
        }
      }

      setEntries((currentEntries) => [...currentEntries, ...createdEntries]);

      for (const entry of createdEntries) {
        if (entry.status === "uploading") {
          void startUpload(entry);
        }
      }
    },
    [startUpload],
  );

  const removeEntry = useCallback((entryId: string) => {
    setEntries((currentEntries) => {
      const entryToRemove = currentEntries.find(
        (entry) => entry.entryId === entryId,
      );

      if (entryToRemove !== undefined) {
        entryToRemove.abortController.abort();
        URL.revokeObjectURL(entryToRemove.previewUrl);
      }

      return currentEntries.filter((entry) => entry.entryId !== entryId);
    });
  }, []);

  const retryEntry = useCallback(
    (entryId: string) => {
      const existingEntry = entriesRef.current.find(
        (entry) => entry.entryId === entryId,
      );

      if (existingEntry === undefined) {
        return;
      }

      const retriedEntry: PhotoEntry = {
        ...existingEntry,
        status: "uploading",
        failureDetail: null,
        abortController: new AbortController(),
      };

      applyEntryUpdate(entryId, retriedEntry);
      void startUpload(retriedEntry);
    },
    [applyEntryUpdate, startUpload],
  );

  const occupiedSlotCount = countEntriesOccupyingASlot(entries);

  return {
    draftId: draftIdRef.current,
    entries,
    uploadedPhotos: entries
      .map((entry) => entry.uploadedPhoto)
      .filter((photo): photo is UploadedPhoto => photo !== null),
    occupiedSlotCount,
    canAddMorePhotos: occupiedSlotCount < MAX_PHOTOS_PER_BOOKING,
    hasUploadInFlight: entries.some((entry) => entry.status === "uploading"),
    addFiles,
    removeEntry,
    retryEntry,
  };
}