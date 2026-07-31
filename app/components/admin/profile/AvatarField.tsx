// app/components/admin/profile/AvatarField.tsx

import { useEffect, useRef, useState } from "react";
import { useFetcher } from "react-router";
import { buildPortfolioImageUrl } from "~/lib/media/portfolioImageUrl";
import styles from "./ArtistProfileForm.module.css";

/**
 * The avatar upload control. Renders the current avatar as a thumbnail, plus a
 * file input that on selection uploads to /api/artist-avatar and re-renders
 * with the returned key on success.
 *
 * Unlike the rest of the profile form, avatar changes commit immediately —
 * there is no "Save changes" step. The mental model is "pick a photo, replace
 * it" rather than "collect edits, save them together." That's why avatar has
 * its own fetcher separate from the profile-patch fetcher, and why it isn't
 * batched into the form's dirty tracking.
 *
 * The uploaded key comes back from the endpoint. The loader-provided key is
 * used only for the initial render; after any successful upload, the newer key
 * takes over. That means the just-uploaded avatar shows without waiting for a
 * loader revalidation to catch up.
 */

/**
 * The endpoint enforces this too; the client check is a fast-fail so the user
 * doesn't waste bandwidth on a file the server will just reject. Kept in sync
 * with `MAX_AVATAR_UPLOAD_BYTES` in `app/routes/api.artist-avatar.ts`.
 */
const MAX_AVATAR_UPLOAD_BYTES = 25 * 1024 * 1024;

const ACCEPTED_IMAGE_TYPES =
  "image/jpeg,image/png,image/webp,image/heic,image/heif";

/**
 * User-facing copy for each failure code the endpoint returns. Codes without
 * an entry fall through to the generic message. Kept minimal — this is admin
 * UI, artists know what "too large" means, no need to explain byte counts.
 */
const FAILURE_MESSAGES: Record<string, string> = {
  file_too_large: "That file is too large.",
  empty_file: "That file is empty.",
  missing_file: "No file was received. Try again.",
  invalid_artist_id: "The upload could not be matched to your account.",
  forbidden: "You aren't allowed to do that.",
  artist_not_found: "Your account could not be found.",
  unreadable_image: "That file doesn't look like an image.",
  unsupported_source_format: "That image format isn't supported.",
  transformation_failed: "The image couldn't be processed.",
  storage_failed: "The upload didn't complete. Please try again.",
  persist_failed: "The upload didn't complete. Please try again.",
};

const GENERIC_FAILURE_MESSAGE = "Something went wrong with the upload.";

type AvatarUploadSuccessResponse = {
  ok: true;
  avatar: {
    objectKey: string;
    width: number;
    height: number;
  };
};

type AvatarUploadFailureResponse = {
  ok: false;
  failureCode: string;
  detail: string;
};

type AvatarUploadResponse =
  AvatarUploadSuccessResponse | AvatarUploadFailureResponse;

type AvatarFieldProps = {
  initialAvatar: {
    objectKey: string | null;
    width: number | null;
    height: number | null;
  };
};

export default function AvatarField(props: AvatarFieldProps) {
  const { initialAvatar } = props;

  const fetcher = useFetcher<AvatarUploadResponse>();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [displayedAvatar, setDisplayedAvatar] = useState(initialAvatar);
  const [clientErrorMessage, setClientErrorMessage] = useState<string | null>(
    null,
  );

  const isUploading =
    fetcher.state === "submitting" || fetcher.state === "loading";

  // Sync displayed avatar with the fetcher's most recent successful response.
  // Using an effect (not the render body) because the update depends on
  // fetcher.data + a specific state transition, and doing this in render
  // would loop: setState → re-render → same fetcher.data → setState again.
  useEffect(() => {
    if (fetcher.state !== "idle") {
      return;
    }
    if (fetcher.data === undefined || !fetcher.data.ok) {
      return;
    }
    setDisplayedAvatar({
      objectKey: fetcher.data.avatar.objectKey,
      width: fetcher.data.avatar.width,
      height: fetcher.data.avatar.height,
    });
  }, [fetcher.state, fetcher.data]);

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const chosenFile = event.currentTarget.files?.[0];

    if (chosenFile === undefined) {
      return;
    }

    setClientErrorMessage(null);

    if (chosenFile.size === 0) {
      setClientErrorMessage("That file is empty.");
      resetFileInput();
      return;
    }

    if (chosenFile.size > MAX_AVATAR_UPLOAD_BYTES) {
      setClientErrorMessage("That file is too large.");
      resetFileInput();
      return;
    }

    const uploadFormData = new FormData();
    uploadFormData.set("photo", chosenFile);

    fetcher.submit(uploadFormData, {
      method: "post",
      action: "/api/artist-avatar",
      encType: "multipart/form-data",
    });

    resetFileInput();
  }

  function resetFileInput() {
    // Clearing the input's value lets the user pick the same file again after
    // a failed upload (the change event only fires when the selected file
    // actually differs from the current one).
    if (fileInputRef.current !== null) {
      fileInputRef.current.value = "";
    }
  }

  const serverErrorMessage = getServerErrorMessage(fetcher.data);
  const displayedErrorMessage = clientErrorMessage ?? serverErrorMessage;

  const hasAvatar = displayedAvatar.objectKey !== null;

  return (
    <div className={styles.root}>
      <div className={styles.thumbnailArea}>
        {hasAvatar ? (
          <img
            src={buildPortfolioImageUrl(displayedAvatar.objectKey!)}
            width={displayedAvatar.width ?? undefined}
            height={displayedAvatar.height ?? undefined}
            alt="Your current avatar"
            className={styles.thumbnail}
          />
        ) : (
          <div className={styles.thumbnailPlaceholder} aria-hidden="true">
            No avatar
          </div>
        )}
      </div>

      <div className={styles.controls}>
        <label className={styles.uploadButton}>
          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPTED_IMAGE_TYPES}
            onChange={handleFileChange}
            disabled={isUploading}
            className={styles.fileInput}
          />
          {isUploading
            ? "Uploading…"
            : hasAvatar
              ? "Replace avatar"
              : "Upload avatar"}
        </label>

        <p className={styles.hint}>JPEG, PNG, WebP or HEIC. Up to 25 MB.</p>

        {displayedErrorMessage !== null && (
          <p role="alert" className={styles.error}>
            {displayedErrorMessage}
          </p>
        )}
      </div>
    </div>
  );
}

function getServerErrorMessage(
  response: AvatarUploadResponse | undefined,
): string | null {
  if (response === undefined || response.ok) {
    return null;
  }

  return FAILURE_MESSAGES[response.failureCode] ?? GENERIC_FAILURE_MESSAGE;
}
