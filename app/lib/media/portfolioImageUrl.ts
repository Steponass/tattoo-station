// app/lib/media/portfolioImageUrl.ts

const PORTFOLIO_IMAGE_ROUTE_BASE = "/portfolio-image";

/**
 * Builds the delivery URL for a portfolio master's object key.
 *
 * Interim implementation: points at the public passthrough route, which serves
 * the full-resolution master. When the custom domain is live, this is the one
 * place that changes — it will emit /cdn-cgi/image/<options>/<source> URLs at
 * the fixed width ladder instead, with the rest of the app untouched.
 */
export function buildPortfolioImageUrl(objectKey: string): string {
  return `${PORTFOLIO_IMAGE_ROUTE_BASE}/${objectKey}`;
}