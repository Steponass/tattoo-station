import {
  NORMALIZED_JPEG_QUALITY,
  NORMALIZED_OUTPUT_FORMAT,
} from "./imageConstants";
import {
  calculateScaleDownDimensions,
  type ImageDimensions,
} from "./calculateScaleDownDimensions";

export type NormalizeFailureCode =
  | "unreadable_image"
  | "unsupported_source_format"
  | "transformation_failed";

export type NormalizedImage = {
  bytes: ArrayBuffer;
  contentType: string;
  width: number;
  height: number;
  byteSize: number;
  sourceFormat: string;
};

export type NormalizeImageResult =
  | { ok: true; image: NormalizedImage }
  | { ok: false; failureCode: NormalizeFailureCode; detail: string };

type SourceImageInfo = {
  format: string;
  width: number;
  height: number;
};

type SourceInfoOutcome =
  | { kind: "raster"; format: string; width: number; height: number }
  | { kind: "vector" }
  | { kind: "undecodable" };

function createStreamFromBytes(bytes: ArrayBuffer): ReadableStream {
  return new Blob([bytes]).stream();
}

/**
 * Reads format and dimensions from the source bytes.
 *
 * Returns null when the binding cannot decode the input at all, which is the
 * signal that the upload was not a usable image.
 */
async function readSourceImageInfo(
  images: ImagesBinding,
  sourceBytes: ArrayBuffer,
): Promise<SourceInfoOutcome> {
  try {
    const info = await images.info(createStreamFromBytes(sourceBytes));

    if (!("width" in info) || !("height" in info)) {
      return { kind: "vector" };
    }

    return {
      kind: "raster",
      format: info.format,
      width: info.width,
      height: info.height,
    };
  } catch {
    return { kind: "undecodable" };
  }
}

/**
 * Converts an arbitrary user-uploaded image (including iPhone HEIC) into the
 * canonical master format: JPEG, longest edge capped, EXIF metadata stripped.
 *
 * Dimensions are returned so callers can persist them and reserve layout space
 * before the image loads.
 *
 * Does not touch R2 or D1 — storage is the caller's concern.
 */
export async function normalizeImage({
  images,
  sourceBytes,
  maxEdgePixels,
}: {
  images: ImagesBinding;
  sourceBytes: ArrayBuffer;
  maxEdgePixels: number;
}): Promise<NormalizeImageResult> {
  const sourceInfo = await readSourceImageInfo(images, sourceBytes);

  if (sourceInfo.kind === "vector") {
    return {
      ok: false,
      failureCode: "unsupported_source_format",
      detail: "SVG images are not accepted. Please upload a photo.",
    };
  }

  if (sourceInfo.kind === "undecodable") {
    return {
      ok: false,
      failureCode: "unreadable_image",
      detail: "The uploaded file could not be decoded as an image.",
    };
  }

  const outputDimensions: ImageDimensions = calculateScaleDownDimensions({
    sourceDimensions: { width: sourceInfo.width, height: sourceInfo.height },
    maxEdgePixels,
  });

  try {
    const transformationResult = await images
      .input(createStreamFromBytes(sourceBytes))
      .transform({
        width: maxEdgePixels,
        height: maxEdgePixels,
        fit: "scale-down",
      })
      .output({
        format: NORMALIZED_OUTPUT_FORMAT,
        quality: NORMALIZED_JPEG_QUALITY,
      })

    const normalizedBytes = await transformationResult.response().arrayBuffer();

    return {
      ok: true,
      image: {
        bytes: normalizedBytes,
        contentType: NORMALIZED_OUTPUT_FORMAT,
        width: outputDimensions.width,
        height: outputDimensions.height,
        byteSize: normalizedBytes.byteLength,
        sourceFormat: sourceInfo.format,
      },
    };
  } catch (error) {
    return {
      ok: false,
      failureCode: "transformation_failed",
      detail: error instanceof Error ? error.message : String(error),
    };
  }
}