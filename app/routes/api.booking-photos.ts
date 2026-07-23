// app/routes/api.booking-photos.ts

import { storeBookingPhoto } from "~/lib/booking/server/bookingPhotos.server";
import {
  MAX_PHOTO_BYTES,
  validatePhotoSelection,
} from "~/lib/booking/photoConstraints";
import { getCloudflareBindings } from "~/lib/cloudflare/cloudflareContext";
import type { UploadPhotoOutcome } from "~/lib/booking/uploadBookingPhoto";
import type { Route } from "./+types/api.booking-photos";

const DRAFT_ID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function rejectUpload(
  failureCode: string,
  detail: string,
  status: number,
): Response {
  const outcome: UploadPhotoOutcome = { ok: false, failureCode, detail };

  return Response.json(outcome, { status });
}

/**
 * Accepts one reference photo, normalizes it, and stores it in R2.
 *
 * One file per request so that a failure affects only that file and each can be
 * retried independently. Uploads happen while the customer is still completing
 * the form, so the submit action carries only object keys.
 *
 * Re-applies the client-side constraints: this endpoint is publicly reachable
 * and the browser's checks are a convenience, not a control.
 */
export async function action({ request, context }: Route.ActionArgs) {
  const { env } = getCloudflareBindings(context);
  const formData = await request.formData();

  const draftId = formData.get("draftId");

  if (typeof draftId !== "string" || !DRAFT_ID_PATTERN.test(draftId)) {
    return rejectUpload(
      "invalid_draft",
      "Missing or malformed submission identifier.",
      400,
    );
  }

  const uploadedFile = formData.get("photo");

  if (!(uploadedFile instanceof File)) {
    return rejectUpload("missing_file", "No photo was received.", 400);
  }

  const validation = validatePhotoSelection({
    fileName: uploadedFile.name,
    mimeType: uploadedFile.type,
    fileSizeBytes: uploadedFile.size,
    // Per-request endpoint: the total count is enforced at submit time, where
    // the full set of keys is known.
    alreadySelectedCount: 0,
  });

  if (!validation.accepted) {
    return rejectUpload(
      validation.rejectionCode,
      "The file was rejected.",
      422,
    );
  }

  // Guards against a declared size that understates the actual payload.
  const sourceBytes = await uploadedFile.arrayBuffer();

  if (sourceBytes.byteLength > MAX_PHOTO_BYTES) {
    return rejectUpload("file_too_large", "The file is too large.", 413);
  }

  const storeResult = await storeBookingPhoto({
    images: env.IMAGES,
    mediaBucket: env.MEDIA,
    draftId,
    sourceBytes,
  });

  if (!storeResult.ok) {
    console.error(
      "[booking-photos] storage failed:",
      storeResult.failureCode,
      storeResult.detail,
    );

    return rejectUpload(
      storeResult.failureCode,
      "The photo could not be processed.",
      422,
    );
  }

  const outcome: UploadPhotoOutcome = { ok: true, photo: storeResult.photo };

  return Response.json(outcome);
}