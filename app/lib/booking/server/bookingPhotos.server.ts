// app/lib/booking/server/bookingPhotos.server.ts

import { normalizeImage } from "~/lib/images/normalizeImage.server";
import { REFERENCE_MAX_EDGE_PIXELS } from "~/lib/images/imageConstants";
import {
  buildBookingPhotoKey,
  buildBookingPhotoPrefix,
} from "~/lib/media/mediaKeys";

export type StoreBookingPhotoFailureCode =
  | "unreadable_image"
  | "unsupported_source_format"
  | "transformation_failed"
  | "storage_failed";

export type StoredBookingPhoto = {
  objectKey: string;
  width: number;
  height: number;
  byteSize: number;
};

export type StoreBookingPhotoResult =
  | { ok: true; photo: StoredBookingPhoto }
  | { ok: false; failureCode: StoreBookingPhotoFailureCode; detail: string };

/**
 * Normalizes a single uploaded reference photo and writes it to R2.
 *
 * Photos are written to their final location immediately rather than to a
 * staging prefix — abandoned uploads are swept by the bucket lifecycle rule
 * rather than moved on submit, since R2 has no server-side copy.
 */
export async function storeBookingPhoto({
  images,
  mediaBucket,
  draftId,
  sourceBytes,
}: {
  images: ImagesBinding;
  mediaBucket: R2Bucket;
  draftId: string;
  sourceBytes: ArrayBuffer;
}): Promise<StoreBookingPhotoResult> {
  const normalizeResult = await normalizeImage({
    images,
    sourceBytes,
    maxEdgePixels: REFERENCE_MAX_EDGE_PIXELS,
  });

  if (!normalizeResult.ok) {
    return {
      ok: false,
      failureCode: normalizeResult.failureCode,
      detail: normalizeResult.detail,
    };
  }

  const { bytes, contentType, width, height, byteSize } = normalizeResult.image;
  const objectKey = buildBookingPhotoKey({
    draftId,
    photoId: crypto.randomUUID(),
  });

  try {
    await mediaBucket.put(objectKey, bytes, {
      httpMetadata: { contentType },
        customMetadata: {
        width: String(width),
        height: String(height),
      },
    });
  } catch (error) {
    return {
      ok: false,
      failureCode: "storage_failed",
      detail: error instanceof Error ? error.message : String(error),
    };
  }

  return {
    ok: true,
    photo: { objectKey, width, height, byteSize },
  };
}

export type VerifiedBookingPhotos = {
  verifiedPhotos: StoredBookingPhoto[];
  rejectedKeys: string[];
};

function parseDimension(rawValue: string | undefined): number {
  const parsedValue = Number(rawValue);

  return Number.isFinite(parsedValue) && parsedValue > 0 ? parsedValue : 0;
}

/**
 * Confirms that every submitted key belongs to this draft and exists in R2,
 * returning the stored photos with their dimensions.
 *
 * Object keys arrive from the browser and are untrusted: a caller could submit
 * keys belonging to another booking, or keys that were never uploaded.
 *
 * Uses `head` rather than `get` so verifying five photos costs five metadata
 * reads instead of several megabytes of transfer inside the action.
 */
export async function verifyBookingPhotos({
  mediaBucket,
  draftId,
  submittedKeys,
}: {
  mediaBucket: R2Bucket;
  draftId: string;
  submittedKeys: string[];
}): Promise<VerifiedBookingPhotos> {
  const expectedPrefix = buildBookingPhotoPrefix(draftId);

  const prefixMatchedKeys = submittedKeys.filter((key) =>
    key.startsWith(expectedPrefix),
  );

  const headResults = await Promise.all(
    prefixMatchedKeys.map(async (objectKey) => ({
      objectKey,
      storedObject: await mediaBucket.head(objectKey),
    })),
  );

  const verifiedPhotos: StoredBookingPhoto[] = [];

  for (const { objectKey, storedObject } of headResults) {
    if (storedObject === null) {
      continue;
    }

    verifiedPhotos.push({
      objectKey,
      width: parseDimension(storedObject.customMetadata?.width),
      height: parseDimension(storedObject.customMetadata?.height),
      byteSize: storedObject.size,
    });
  }

  const verifiedKeys = new Set(
    verifiedPhotos.map((photo) => photo.objectKey),
  );

  return {
    verifiedPhotos,
    rejectedKeys: submittedKeys.filter((key) => !verifiedKeys.has(key)),
  };
}