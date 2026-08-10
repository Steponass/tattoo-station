// app/lib/media/portfolioImageAttributes.ts

/**
 * The Worker route that serves a portfolio master. It stays in place as the
 * origin for every /cdn-cgi/image/ transform — variants fetch from here on
 * transform cache miss (rare: once per unique variant per PoP).
 */
const PORTFOLIO_IMAGE_ROUTE_BASE = "/portfolio-image";

/**
 * Cloudflare's transform pipeline runs at this same-zone path. Format:
 *   /cdn-cgi/image/<options>/<source-path>
 * where <options> is comma-separated key=value and <source-path> is the
 * origin URL (absolute or same-zone relative).
 */
const CLOUDFLARE_TRANSFORM_PREFIX = "/cdn-cgi/image";

/**
 * Options shared by every variant. `format=auto` lets Cloudflare pick webp
 * or avif based on the client's Accept header (jpeg fallback); `quality=85`
 * is the visual/bytes middle-of-road we're starting with, single value
 * across every surface.
 */
const SHARED_TRANSFORM_OPTIONS = "format=auto%2Cquality=75";

/**
 * Fixed width ladder for srcset. Bounds the count of unique transform
 * variants — Cloudflare bills once per variant per edge PoP, and the free
 * tier caps at 5,000 variants/month. Four widths per master × ~450 masters
 * at full portfolio × handful of PoPs stays well under.
 *
 * Landing zones, roughly: dense thumbnails (400), gallery tiles (800),
 * full-viewport standard-DPR (1280), full-viewport HiDPI / lightbox (2560).
 */
const LADDER_WIDTHS = [400, 800, 1280, 2560] as const;

/**
 * The width used for the `src` fallback attribute. Browsers that respect
 * srcset ignore this in favour of a ladder pick; browsers that don't (rare
 * but not zero) get a sensible middle-of-road file. 800 sits between
 * "thumbnail" and "full-viewport standard-DPR".
 */
const FALLBACK_SRC_WIDTH = 800;

export type PortfolioImageAttributes = {
  src: string;
  srcSet: string;
  sizes: string;
};

/**
 * Builds the `src`, `srcSet`, and `sizes` attributes for a portfolio master,
 * emitting responsive /cdn-cgi/image/ URLs at the fixed width ladder.
 *
 * The consumer provides `sizes` because only the surrounding layout knows
 * how wide the image is rendered — this builder stays layout-agnostic.
 */
export function buildPortfolioImageAttributes({
  objectKey,
  sizes,
}: {
  objectKey: string;
  sizes: string;
}): PortfolioImageAttributes {
  const originPath = buildOriginPath(objectKey);

  return {
    src: buildTransformUrl({ originPath, width: FALLBACK_SRC_WIDTH }),
    srcSet: buildSrcSet(originPath),
    sizes,
  };
}

/**
 * Builds a single flat image URL for a CSS `background-image` tile —
 * i.e. a tile with no `<img>` element in the DOM at all. LandingGallery
 * uses this: iOS Safari can offer its native long-press "lift this
 * photo" drag/share gesture on an `<img>`, and nothing short of removing
 * the `<img>` node stops it. No `srcSet`/`sizes` ladder here since
 * `background-image` has no responsive-image mechanism without
 * `image-set()`; the "gallery tiles" width tier is a reasonable flat
 * size for the small tiles this is used for.
 */
export function buildPortfolioImageBackgroundUrl({
  objectKey,
}: {
  objectKey: string;
}): string {
  const originPath = buildOriginPath(objectKey);
  return buildTransformUrl({ originPath, width: LADDER_WIDTHS[1] });
}

function buildOriginPath(objectKey: string): string {
  return `${PORTFOLIO_IMAGE_ROUTE_BASE}/${objectKey}`;
}

function buildTransformUrl({
  originPath,
  width,
}: {
  originPath: string;
  width: number;
}): string {
  // The /cdn-cgi/image/ transform is a Cloudflare edge feature — it only
  // exists once the site is actually proxied through Cloudflare. Local dev
  // (`react-router dev`) has no such proxy in front of it, so the transform
  // path 404s there; fall back to the untransformed origin route instead.
  if (import.meta.env.DEV) {
    return originPath;
  }

  const options = `${SHARED_TRANSFORM_OPTIONS}%2Cwidth=${width}`;

  return `${CLOUDFLARE_TRANSFORM_PREFIX}/${options}${originPath}`;
}

function buildSrcSet(originPath: string): string {
  return LADDER_WIDTHS
    .map((width) => `${buildTransformUrl({ originPath, width })} ${width}w`)
    .join(", ");
}