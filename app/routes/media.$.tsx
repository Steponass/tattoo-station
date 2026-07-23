// app/routes/media.$.tsx

import { getCloudflareBindings } from "~/lib/cloudflare/cloudflareContext";
import { verifyMediaSignature } from "~/lib/media/signedMediaUrl.server";
import type { Route } from "./+types/media.$";

/**
 * Object key prefixes this route is permitted to serve. Defence in depth: the
 * signature already covers the key, but this bounds the blast radius if the
 * signing secret is ever leaked.
 */
const SERVABLE_KEY_PREFIXES = ["bookings/"];

function isServableKey(objectKey: string): boolean {
  return SERVABLE_KEY_PREFIXES.some((prefix) => objectKey.startsWith(prefix));
}

export async function loader({ request, params, context }: Route.LoaderArgs) {
  const objectKey = params["*"] ?? "";

  if (!isServableKey(objectKey)) {
    return new Response("Not found", { status: 404 });
  }

  const { env } = getCloudflareBindings(context);
  const requestUrl = new URL(request.url);

  const verification = await verifyMediaSignature({
    signingSecret: env.MEDIA_URL_SIGNING_SECRET,
    objectKey,
    expiresParameter: requestUrl.searchParams.get("expires"),
    signatureParameter: requestUrl.searchParams.get("signature"),
  });

  if (verification.status === "expired") {
    return new Response(
      "This link has expired. Please ask the studio to resend it.",
      { status: 410 },
    );
  }

  if (verification.status === "invalid") {
    return new Response("Not found", { status: 404 });
  }

  const storedObject = await env.MEDIA.get(objectKey);

  if (storedObject === null) {
    return new Response("Not found", { status: 404 });
  }

  return new Response(storedObject.body, {
    headers: {
      "content-type":
        storedObject.httpMetadata?.contentType ?? "application/octet-stream",
      "content-length": String(storedObject.size),
      "cache-control": "private, max-age=3600",
      "x-content-type-options": "nosniff",
      "content-disposition": "inline",
    },
  });
}