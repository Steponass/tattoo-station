import { useId, useRef } from "react";

import {
  MAX_PHOTOS_PER_BOOKING,
  PHOTO_INPUT_ACCEPT_ATTRIBUTE,
} from "~/lib/booking/photoConstraints";
import type { PhotoEntry } from "~/lib/booking/usePhotoSelection";
import type { UploadedPhoto } from "~/lib/booking/uploadBookingPhoto";
import type { PhotoStatusMessages } from "./PhotoPreviewItem";
import { PhotoPreviewList } from "./PhotoPreviewList";
import styles from '../BookingForm.module.css'

export const PHOTO_KEYS_FIELD_NAME = "photoKeys";

export function PhotoUploadField({
  field,
  photos,
  resolveMessages,
}: {
  field: {
    name: string;
    label: string;
    hint?: string;
    errorMessage?: string;
  };
  photos: {
    entries: PhotoEntry[];
    uploadedPhotos: UploadedPhoto[];
    canAddMorePhotos: boolean;
    addFiles: (files: File[]) => void;
    removeEntry: (entryId: string) => void;
    retryEntry: (entryId: string) => void;
  };
  resolveMessages: (entry: PhotoEntry) => PhotoStatusMessages;
  chooseFilesLabel: string;
}) {
  const generatedId = useId();
  const controlId = `${generatedId}-control`;
  const hintId = `${generatedId}-hint`;
  const errorId = `${generatedId}-error`;

  const describedByIdList = [
    field.hint === undefined ? null : hintId,
    field.errorMessage === undefined ? null : errorId,
  ].filter((id): id is string => id !== null);
  const describedByIds =
    describedByIdList.length === 0 ? undefined : describedByIdList.join(" ");

  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleFilesSelected(event: React.ChangeEvent<HTMLInputElement>) {
    const selectedFiles = Array.from(event.currentTarget.files ?? []);
    photos.addFiles(selectedFiles);

    // Clearing the input allows the same file to be chosen again after removal.
    event.currentTarget.value = "";
  }

  return (
    <div className={`${styles.field} ${styles.full_width}`}
>
      <label htmlFor={controlId} data-field-label>
        {field.label}
      </label>

      {field.hint !== undefined && (
        <p id={hintId} data-field-hint>
          {field.hint}
        </p>
      )}

      <input
        id={controlId}
        name={field.name}
        ref={fileInputRef}
        type="file"
        multiple
        accept={PHOTO_INPUT_ACCEPT_ATTRIBUTE}
        disabled={!photos.canAddMorePhotos}
        onChange={handleFilesSelected}
        data-photo-input
      />

      <PhotoPreviewList
        entries={photos.entries}
        resolveMessages={resolveMessages}
        onRemove={photos.removeEntry}
        onRetry={photos.retryEntry}
      />

      <UploadedPhotoKeyInputs uploadedPhotos={photos.uploadedPhotos} />
    </div>
  );
}

/**
 * Carries confirmed object keys into the form submission. Only successfully
 * uploaded photos are represented, so a failed upload cannot reach the action.
 */
function UploadedPhotoKeyInputs({
  uploadedPhotos,
}: {
  uploadedPhotos: UploadedPhoto[];
}) {
  return (
    <>
      {uploadedPhotos.map((photo) => (
        <input
          key={photo.objectKey}
          type="hidden"
          name={PHOTO_KEYS_FIELD_NAME}
          value={photo.objectKey}
        />
      ))}
    </>
  );
}
