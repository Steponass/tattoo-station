// app/lib/images/imageConstants.ts

/** Longest edge for artist portfolio masters. Archival originals. */
export const PORTFOLIO_MAX_EDGE_PIXELS = 3000;

export const AVATAR_MAX_EDGE_PIXELS = 1200;

/**
 * Longest edge for booking reference photos. Smaller than portfolio masters
 * because these are served directly from R2 with no delivery-time transform —
 * an artist opening a booking on mobile downloads them at full size.
 */
export const REFERENCE_MAX_EDGE_PIXELS = 1600;

export const NORMALIZED_JPEG_QUALITY = 88;

export const NORMALIZED_OUTPUT_FORMAT = "image/jpeg";

export const NORMALIZED_FILE_EXTENSION = "jpg";