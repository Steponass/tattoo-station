import { useState } from "react";

import type { PhotoEntry } from "~/lib/booking/usePhotoSelection";

export type PhotoStatusMessages = {
  uploading: string;
  uploaded: string;
  retryLabel: string;
  removeLabel: string;
  /** Resolved message for the entry's rejection or failure reason. */
  problemMessage?: string;
};

export function PhotoPreviewItem({
  entry,
  messages,
  onRemove,
  onRetry,
}: {
  entry: PhotoEntry;
  messages: PhotoStatusMessages;
  onRemove: (entryId: string) => void;
  onRetry: (entryId: string) => void;
}) {
  return (
    <li data-photo-item data-status={entry.status}>
      <PhotoThumbnail previewUrl={entry.previewUrl} fileName={entry.fileName} />

      <PhotoStatusLabel status={entry.status} messages={messages} />

      <PhotoRetryButton
        status={entry.status}
        label={messages.retryLabel}
        onRetry={() => onRetry(entry.entryId)}
      />

      <button
        type="button"
        onClick={() => onRemove(entry.entryId)}
        data-photo-remove
      >
        {messages.removeLabel}
      </button>
    </li>
  );
}

/**
 * HEIC files cannot be rendered by most browsers, so a broken preview is the
 * expected case for iPhone uploads rather than an error. Falls back to the
 * filename once the image fails to decode.
 */
function PhotoThumbnail({
  previewUrl,
  fileName,
}: {
  previewUrl: string;
  fileName: string;
}) {
  const [isPreviewRenderable, setIsPreviewRenderable] = useState(true);

  if (!isPreviewRenderable) {
    return <div data-photo-thumbnail data-photo-thumbnail-fallback aria-hidden />;
  }

  return (
    <img
      src={previewUrl}
      alt={fileName}
      data-photo-thumbnail
      onError={() => setIsPreviewRenderable(false)}
    />
  );
}

const STATUS_MESSAGE_KEYS = {
  uploading: "uploading",
  uploaded: "uploaded",
} as const;

function PhotoStatusLabel({
  status,
  messages,
}: {
  status: PhotoEntry["status"];
  messages: PhotoStatusMessages;
}) {
  if (status === "rejected" || status === "failed") {
    return (
      <p data-photo-status role="alert">
        {messages.problemMessage}
      </p>
    );
  }

  return (
    <p data-photo-status aria-live="polite">
      {messages[STATUS_MESSAGE_KEYS[status]]}
    </p>
  );
}

function PhotoRetryButton({
  status,
  label,
  onRetry,
}: {
  status: PhotoEntry["status"];
  label: string;
  onRetry: () => void;
}) {
  if (status !== "failed") {
    return null;
  }

  return (
    <button type="button" onClick={onRetry} data-photo-retry>
      {label}
    </button>
  );
}