export type ImageDimensions = {
  width: number;
  height: number;
};

/**
 * Returns the dimensions an image will have after being scaled down so its
 * longest edge fits within `maxEdgePixels`, preserving aspect ratio.
 *
 * Images already within the limit are returned unchanged — this never
 * enlarges, matching the behaviour of the Images `scale-down` fit mode.
 */
export function calculateScaleDownDimensions({
  sourceDimensions,
  maxEdgePixels,
}: {
  sourceDimensions: ImageDimensions;
  maxEdgePixels: number;
}): ImageDimensions {
  const { width, height } = sourceDimensions;
  const longestEdge = Math.max(width, height);

  if (longestEdge <= maxEdgePixels) {
    return { width, height };
  }

  const scaleFactor = maxEdgePixels / longestEdge;

  return {
    width: Math.round(width * scaleFactor),
    height: Math.round(height * scaleFactor),
  };
}