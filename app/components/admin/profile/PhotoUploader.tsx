import { useRef, useState } from "react";
import { uploadArtistPhoto } from "~/lib/artists/uploadArtistPhoto";
import styles from "./PhotoUploader.module.css";

/**
 * File picker + upload driver for the photo grid. Accepts multiple files at
 * once; uploads them sequentially, one HTTP request per file (matching the
 * booking form's upload pattern and the endpoint's contract). Each
 * successful upload is reported to the parent via `onPhotoUploaded` so the
 * parent can append it to the grid immediately.
 *
 * Sequential uploads (not parallel) avoid two problems: (a) hitting
 * `MAX_PORTFOLIO_PHOTOS_PER_ARTIST` in the middle of a batch with an
 * ambiguous outcome, since each upload contributes to the same cap check on
 * the server; (b) piling on the D1 write path. If the artist has a
 * slow connection and needs to upload 20 photos in one go, they will wait —
 * but they were going to wait either way, and a serial UX is easier to
 * reason about ("photo 3 of 5 uploaded, photo 4 uploading").
 *
 * Failures per file are collected and displayed at the end of the run,
 * rather than aborting the batch on first error. Uploading 10 photos and
 * losing the third one shouldn't discard the seven queued after it.
 */

const MAX_PORTFOLIO_PHOTOS_PER_ARTIST = 100;

const ACCEPTED_IMAGE_TYPES = "image/jpeg,image/png,image/webp,image/heic,image/heif";

const FAILURE_MESSAGES: Record<string, string> = {
  file_too_large: "That file is too large. Try one under 25 MB.",
  empty_file: "That file is empty.",
  portfolio_full: `You've reached your ${MAX_PORTFOLIO_PHOTOS_PER_ARTIST}-photo limit.`,
  unreadable_image: "That file doesn't look like a valid image.",
  unsupported_source_format: "That image format isn't supported.",
  transformation_failed: "The image couldn't be processed.",
  storage_failed: "The upload didn't complete. Please try again.",
  persist_failed: "The upload didn't complete. Please try again.",
  artist_not_found: "Your account could not be found. Refresh and try again.",
  forbidden: "You aren't allowed to do that.",
  network_error: "Couldn't reach the server. Check your connection and try again.",
  server_error: "The server had a problem with this upload. Please try again.",
};

const GENERIC_FAILURE_MESSAGE = "Something went wrong with that file.";

type UploadedPhoto = {
  id: number;
  objectKey: string;
  width: number;
  style: string | null;
  height: number;
};

type PhotoUploaderProps = {
  currentPhotoCount: number;
  surface?: import("~/lib/artists/uploadArtistPhoto").UploadSurface;
  onPhotoUploaded: (photo: UploadedPhoto) => void;
  /**
   * When set, this uploader is acting on behalf of an admin editing another
   * artist's photos (/admin/artists/:id/*). `category` becomes required in
   * that mode — the admin upload branch has no role to derive it from.
   */
  targetArtistIdForAdmin?: number;
  category?: import("~/lib/artists/artistPhotoCategories").ArtistPhotoCategory;
};

type UploadProgress = {
  totalFiles: number;
  completedFiles: number;
};

type UploadFailure = {
  fileName: string;
  message: string;
};

export default function PhotoUploader(props: PhotoUploaderProps) {
  const {
    currentPhotoCount,
    surface = "main",
    onPhotoUploaded,
    targetArtistIdForAdmin,
    category,
  } = props;

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(
    null,
  );
  const [uploadFailures, setUploadFailures] = useState<UploadFailure[]>([]);

  const isUploading = uploadProgress !== null;
  const remainingSlots = MAX_PORTFOLIO_PHOTOS_PER_ARTIST - currentPhotoCount;
  const isAtCap = remainingSlots <= 0;

  async function handleFileChange(
    event: React.ChangeEvent<HTMLInputElement>,
  ) {
    const chosenFiles = event.currentTarget.files;

    if (chosenFiles === null || chosenFiles.length === 0) {
      return;
    }

    const filesArray = Array.from(chosenFiles);
    const filesToUpload = filesArray.slice(0, remainingSlots);

    resetFileInput();
    setUploadFailures([]);
    setUploadProgress({
      totalFiles: filesToUpload.length,
      completedFiles: 0,
    });

    const failuresAccumulator: UploadFailure[] = [];

    for (const file of filesToUpload) {
      const uploadResult =
        targetArtistIdForAdmin !== undefined && category !== undefined
          ? await uploadArtistPhoto({
              file,
              targetArtistIdForAdmin,
              category,
            })
          : await uploadArtistPhoto({ file, surface });

      if (uploadResult.ok) {
        onPhotoUploaded(uploadResult.photo);
      } else {
        failuresAccumulator.push({
          fileName: file.name,
          message:
            FAILURE_MESSAGES[uploadResult.failureCode] ??
            GENERIC_FAILURE_MESSAGE,
        });
      }

      setUploadProgress((previous) => {
        if (previous === null) {
          return null;
        }
        return {
          totalFiles: previous.totalFiles,
          completedFiles: previous.completedFiles + 1,
        };
      });
    }

    setUploadFailures(failuresAccumulator);
    setUploadProgress(null);
  }

  function resetFileInput() {
    if (fileInputRef.current !== null) {
      fileInputRef.current.value = "";
    }
  }

  return (
    <div className={styles.root}>
      <div className={styles.controlRow}>
        <label className={styles.uploadButton} data-disabled={isAtCap || isUploading}>
          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPTED_IMAGE_TYPES}
            onChange={handleFileChange}
            multiple
            disabled={isAtCap || isUploading}
            className={styles.fileInput}
          />
          {isUploading ? "Uploading…" : isAtCap ? "Portfolio full" : "Upload photos"}
        </label>

        <p className={styles.counter}>
          {currentPhotoCount} / {MAX_PORTFOLIO_PHOTOS_PER_ARTIST}
        </p>
      </div>

      {isUploading && (
        <p className={styles.progressText} aria-live="polite">
          Uploading {uploadProgress.completedFiles + 1} of{" "}
          {uploadProgress.totalFiles}…
        </p>
      )}

      {uploadFailures.length > 0 && (
        <ul className={styles.failureList} role="list">
          {uploadFailures.map((failure) => (
            <li key={failure.fileName} className={styles.failureItem}>
              <span className={styles.failureFileName}>{failure.fileName}</span>
              <span>{failure.message}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}