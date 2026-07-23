import type { PhotoEntry } from "~/lib/booking/usePhotoSelection";
import {
  PhotoPreviewItem,
  type PhotoStatusMessages,
} from "./PhotoPreviewItem";

export function PhotoPreviewList({
  entries,
  resolveMessages,
  onRemove,
  onRetry,
}: {
  entries: PhotoEntry[];
  /** Supplies localized status text for one entry. */
  resolveMessages: (entry: PhotoEntry) => PhotoStatusMessages;
  onRemove: (entryId: string) => void;
  onRetry: (entryId: string) => void;
}) {
  if (entries.length === 0) {
    return null;
  }

  return (
    <ul data-photo-list>
      {entries.map((entry) => (
        <PhotoPreviewItem
          key={entry.entryId}
          entry={entry}
          messages={resolveMessages(entry)}
          onRemove={onRemove}
          onRetry={onRetry}
        />
      ))}
    </ul>
  );
}