// app/components/admin/profile/AvatarField.tsx

import { useEffect, useRef, useState } from "react";
import { useFetcher } from "react-router";
import { buildPortfolioImageAttributes } from "~/lib/media/portfolioImageAttributes";
import styles from "./ArtistProfileForm.module.css";

/**
 * The avatar upload control. Renders the current avatar as a thumbnail, plus a
 * file input that on selection uploads to /api/artist-avatar and re-renders
 * with the returned key on success.
 *
 * `targetArtistIdForAdmin`: when the caller is an admin editing another
 * artist (/admin/artists/:id), this prop carries the target artist's id and
 * gets included in the upload FormData. The server's admin branch of
 * /api/artist-avatar reads it. When the caller is an artist editing
 * themselves (/admin/me), the prop is omitted and the server derives the
 * id from the actor. The artist branch of the endpoint ignores any
 * form-supplied id — the actor-pinning invariant makes it safe to send or
 * not send.
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

const MAX_AVATAR_UPLOAD_BYTES = 25 * 1024 * 1024;

const ACCEPTED_IMAGE_TYPES = "image/jpeg,image/png,image/webp,image/heic,image/heif";

const FAILURE_MESSAGES: Record<string, string> = {
  file_too_large: "That file is too large. Try one under 25 MB.",
  empty_file: "That file is empty.",
  missing_file: "No file was received. Try again.",
  invalid_artist_id: "The upload could not be matched to the target artist.",
  forbidden: "You aren't allowed to do that.",
  artist_not_found: "The target artist could not be found.",
  unreadable_image: "That file doesn't look like a valid image.",
  unsupported_source_format:
    "That image format isn't supported. Try JPEG, PNG, WebP, or HEIC.",
  transformation_failed:
    "The image couldn't be processed. Try a different file.",
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
  | AvatarUploadSuccessResponse
  | AvatarUploadFailureResponse;

type AvatarFieldProps = {
  initialAvatar: {
    objectKey: string | null;
    width: number | null;
    height: number | null;
  };
  targetArtistIdForAdmin?: number;
};

const AVATAR_THUMBNAIL_SIZES = "128px";

type AvatarThumbnailProps = {
  objectKey: string;
  width: number | null;
  height: number | null;
};

function AvatarThumbnail({ objectKey, width, height }: AvatarThumbnailProps) {
  const { src, srcSet, sizes } = buildPortfolioImageAttributes({
    objectKey,
    sizes: AVATAR_THUMBNAIL_SIZES,
  });

  return (
    <img
      src={src}
      srcSet={srcSet}
      sizes={sizes}
      width={width ?? undefined}
      height={height ?? undefined}
      alt="Current avatar"
      className={styles.thumbnail}
    />
  );
}

export default function AvatarField(props: AvatarFieldProps) {
  const { initialAvatar, targetArtistIdForAdmin } = props;

  const fetcher = useFetcher<AvatarUploadResponse>();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [displayedAvatar, setDisplayedAvatar] = useState(initialAvatar);
  const [clientErrorMessage, setClientErrorMessage] = useState<string | null>(
    null,
  );

  const isUploading =
    fetcher.state === "submitting" || fetcher.state === "loading";

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
      setClientErrorMessage("That file is too large. Try one under 25 MB.");
      resetFileInput();
      return;
    }

    const uploadFormData = new FormData();
    uploadFormData.set("photo", chosenFile);

    // For admin callers editing another artist, include the target id so
    // the server's admin branch can route the upload correctly. Artist
    // callers omit this — the endpoint derives the id from the actor and
    // ignores any client-supplied value on the artist branch.
    if (targetArtistIdForAdmin !== undefined) {
      uploadFormData.set("artistId", String(targetArtistIdForAdmin));
    }

    fetcher.submit(uploadFormData, {
      method: "post",
      action: "/api/artist-avatar",
      encType: "multipart/form-data",
    });

    resetFileInput();
  }

  function resetFileInput() {
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
        {displayedAvatar.objectKey !== null ? (
          <AvatarThumbnail
            objectKey={displayedAvatar.objectKey}
            width={displayedAvatar.width}
            height={displayedAvatar.height}
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
          {isUploading ? "Uploading…" : hasAvatar ? "Replace avatar" : "Upload avatar"}
        </label>

        <p className={styles.hint}>
          JPEG, PNG, WebP, or HEIC. Under 25 MB.
        </p>

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