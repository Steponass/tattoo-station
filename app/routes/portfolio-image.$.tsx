// app/routes/portfolio-image.$.tsx

import { getCloudflareBindings } from "~/lib/cloudflare/cloudflareContext";
import type { Route } from "./+types/portfolio-image.$";

/**
 * Only the portfolio master prefix is servable here. Unlike the signed /media
 * route, these images are public by design, so there is no signature — but the
 * prefix check still bounds this route to portfolio objects and nothing else in
 * the bucket.
 */
const SERVABLE_KEY_PREFIX = "masters/";

/**
 * Interim delivery for portfolio masters on the workers.dev subdomain, which
 * cannot use /cdn-cgi/image transforms. Serves the full-resolution master and
 * lets the browser downscale. When the custom domain is live, delivery moves to
 * a /cdn-cgi/image width-ladder URL builder and this route can be retired.
 *
 * A long, immutable cache is safe because object keys are UUID-based: a given
 * key's bytes never change, and replacing a photo means a new key.
 */
export async function loader({ params, context }: Route.LoaderArgs) {
  const objectKey = params["*"] ?? "";

  if (!objectKey.startsWith(SERVABLE_KEY_PREFIX)) {
    return new Response("Not found", { status: 404 });
  }

  const { env } = getCloudflareBindings(context);
  const storedObject = await env.MEDIA.get(objectKey);

  if (storedObject === null) {
    return new Response("Not found", { status: 404 });
  }

  return new Response(storedObject.body, {
    headers: {
      "content-type":
        storedObject.httpMetadata?.contentType ?? "application/octet-stream",
      "content-length": String(storedObject.size),
      "cache-control": "public, max-age=31536000, immutable",
      "x-content-type-options": "nosniff",
      "content-disposition": "inline",
    },
  });
}