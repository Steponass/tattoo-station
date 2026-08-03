// app/routes/api.curate-gallery.ts

import { getCloudflareBindings } from "~/lib/cloudflare/cloudflareContext";
import { resolveActor } from "~/lib/admin/server/resolveActor.server";
import {
  isGalleryName,
  type GalleryName,
} from "~/lib/gallery/galleryPlacementRepository.server";
import {
  curateGallery,
  type CurateGalleryFailureCode,
  type CurateGalleryOperation,
} from "~/lib/gallery/curateGallery.server";
import type { Route } from "../+types/api.curate-gallery";

/**
 * Admin-only. One endpoint covers all three curation operations (add, remove,
 * reorder) via a discriminated JSON envelope. The alternative — three
 * endpoints — would duplicate the actor gate and the envelope parsing
 * three times for no gain, since all three operations share the same
 * admin-only shape.
 *
 * The route action is envelope parsing plus a delegation to the service.
 * Field-level validation lives in the service; the route only enforces
 * envelope shape.
 */

const FAILURE_STATUS: Record<CurateGalleryFailureCode, number> = {
  invalid_operation: 400,
  invalid_gallery: 400,
  invalid_photo_id: 400,
  invalid_ordered_ids: 400,
  already_placed_in_other_gallery: 409,
  not_placed_in_gallery: 404,
  reorder_wrong_count: 409,
  reorder_unknown_ids: 409,
  reorder_missing_ids: 409,
  reorder_duplicate_ids: 400,
  persist_failed: 500,
};

function reject(
  failureCode: string,
  detail: string,
  status: number,
): Response {
  return Response.json({ ok: false, failureCode, detail }, { status });
}

export async function action({ request, context }: Route.ActionArgs) {
  const { env } = getCloudflareBindings(context);

  const actor = await resolveActor(request, env);

  if (actor.kind === "unknown") {
    return reject("forbidden", "Authentication required.", 403);
  }

  if (actor.kind !== "admin") {
    return reject(
      "wrong_actor",
      "Only admins curate galleries.",
      403,
    );
  }

  let parsedBody: unknown;

  try {
    parsedBody = await request.json();
  } catch {
    return reject("invalid_body", "Request body was not valid JSON.", 400);
  }

  const operationResult = parseCurateOperation(parsedBody);

  if (!operationResult.ok) {
    return reject(operationResult.failureCode, operationResult.detail, 400);
  }

  const curateResult = await curateGallery({
    database: env.DB,
    actor,
    operation: operationResult.operation,
  });

  if (!curateResult.ok) {
    return Response.json(curateResult, {
      status: FAILURE_STATUS[curateResult.failureCode],
    });
  }

  return Response.json(curateResult);
}

type OperationParseResult =
  | { ok: true; operation: CurateGalleryOperation }
  | { ok: false; failureCode: string; detail: string };

/**
 * Parses the JSON envelope into a typed operation. The envelope's `kind`
 * discriminant drives which fields the parser requires — `add`/`remove`
 * need `photoId`; `reorder` needs `orderedPhotoIds`. Missing or wrong-typed
 * fields are envelope-layer rejections.
 */
function parseCurateOperation(body: unknown): OperationParseResult {
  if (typeof body !== "object" || body === null) {
    return {
      ok: false,
      failureCode: "invalid_body",
      detail: "Request body must be an object.",
    };
  }

  const bodyRecord = body as Record<string, unknown>;

  const rawGallery = bodyRecord.gallery;

  if (!isGalleryName(rawGallery)) {
    return {
      ok: false,
      failureCode: "invalid_gallery",
      detail: "gallery must be 'landing' or 'flash'.",
    };
  }

  const rawKind = bodyRecord.kind;

  if (rawKind === "add" || rawKind === "remove") {
    const photoIdResult = readPositiveIntegerField({
      value: bodyRecord.photoId,
      fieldName: "photoId",
    });

    if (!photoIdResult.ok) {
      return photoIdResult;
    }

    return {
      ok: true,
      operation: {
        kind: rawKind,
        gallery: rawGallery,
        photoId: photoIdResult.value,
      },
    };
  }

  if (rawKind === "reorder") {
    const orderedIdsResult = readPhotoIdArray(bodyRecord.orderedPhotoIds);

    if (!orderedIdsResult.ok) {
      return orderedIdsResult;
    }

    return {
      ok: true,
      operation: {
        kind: "reorder",
        gallery: rawGallery,
        orderedPhotoIds: orderedIdsResult.value,
      },
    };
  }

  return {
    ok: false,
    failureCode: "invalid_operation",
    detail: "kind must be 'add', 'remove', or 'reorder'.",
  };
}

function readPositiveIntegerField({
  value,
  fieldName,
}: {
  value: unknown;
  fieldName: string;
}):
  | { ok: true; value: number }
  | { ok: false; failureCode: string; detail: string } {
  if (typeof value !== "number" || !Number.isInteger(value) || value <= 0) {
    return {
      ok: false,
      failureCode: "invalid_photo_id",
      detail: `${fieldName} must be a positive integer.`,
    };
  }
  return { ok: true, value };
}

function readPhotoIdArray(
  value: unknown,
):
  | { ok: true; value: number[] }
  | { ok: false; failureCode: string; detail: string } {
  if (!Array.isArray(value)) {
    return {
      ok: false,
      failureCode: "invalid_ordered_ids",
      detail: "orderedPhotoIds must be an array.",
    };
  }

  const parsedIds: number[] = [];

  for (const rawId of value) {
    if (typeof rawId !== "number" || !Number.isInteger(rawId) || rawId <= 0) {
      return {
        ok: false,
        failureCode: "invalid_ordered_ids",
        detail: "Each ordered id must be a positive integer.",
      };
    }
    parsedIds.push(rawId);
  }

  return { ok: true, value: parsedIds };
}