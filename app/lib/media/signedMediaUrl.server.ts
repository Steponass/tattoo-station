// app/lib/media/signedMediaUrl.server.ts

const SIGNATURE_ALGORITHM = { name: "HMAC", hash: "SHA-256" } as const;

/** Booking reference photos expire alongside the booking row itself. */
export const BOOKING_PHOTO_URL_LIFETIME_SECONDS = 40 * 24 * 60 * 60;

const MEDIA_ROUTE_BASE = "/media";

export type SignedMediaUrlParts = {
  objectKey: string;
  expiresAtSeconds: number;
  signature: string;
};

function encodeBase64Url(bytes: ArrayBuffer): string {
  const binaryString = String.fromCharCode(...new Uint8Array(bytes));

  return btoa(binaryString)
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replaceAll("=", "");
}

function decodeBase64Url(value: string): ArrayBuffer {
  const base64 = value.replaceAll("-", "+").replaceAll("_", "/");
  const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
  const binaryString = atob(padded);

  const decodedBuffer = new ArrayBuffer(binaryString.length);
  const decodedBytes = new Uint8Array(decodedBuffer);

  for (let index = 0; index < binaryString.length; index += 1) {
    decodedBytes[index] = binaryString.charCodeAt(index);
  }

  return decodedBuffer;
}

async function importSigningKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    SIGNATURE_ALGORITHM,
    false,
    ["sign", "verify"],
  );
}

/**
 * The exact bytes covered by the signature. Both the object key and the expiry
 * are included, so neither can be altered independently of the other.
 */
function buildSignaturePayload({
  objectKey,
  expiresAtSeconds,
}: {
  objectKey: string;
  expiresAtSeconds: number;
}): ArrayBuffer {
  const encodedText = new TextEncoder().encode(
    `${objectKey}:${expiresAtSeconds}`,
  );
  const payloadBuffer = new ArrayBuffer(encodedText.byteLength);

  new Uint8Array(payloadBuffer).set(encodedText);

  return payloadBuffer;
}

/**
 * Builds a time-limited, tamper-evident URL for an R2 object.
 *
 * Used for reference photos in artist and admin notification emails, which must
 * be openable without a login but must not remain accessible indefinitely.
 */
export async function buildSignedMediaUrl({
  signingSecret,
  origin,
  objectKey,
  lifetimeSeconds,
}: {
  signingSecret: string;
  origin: string;
  objectKey: string;
  lifetimeSeconds: number;
}): Promise<string> {
  const expiresAtSeconds =
    Math.floor(Date.now() / 1000) + lifetimeSeconds;

  const signingKey = await importSigningKey(signingSecret);
  const signatureBytes = await crypto.subtle.sign(
    SIGNATURE_ALGORITHM,
    signingKey,
    buildSignaturePayload({ objectKey, expiresAtSeconds }),
  );

  const searchParams = new URLSearchParams({
    expires: String(expiresAtSeconds),
    signature: encodeBase64Url(signatureBytes),
  });

  return `${origin}${MEDIA_ROUTE_BASE}/${objectKey}?${searchParams}`;
}

export type SignatureVerification =
  | { status: "valid" }
  | { status: "expired" }
  | { status: "invalid" };

/**
 * Verifies a signature using `crypto.subtle.verify`, which compares in constant
 * time — a manual string comparison would leak signature bytes through timing.
 */
export async function verifyMediaSignature({
  signingSecret,
  objectKey,
  expiresParameter,
  signatureParameter,
}: {
  signingSecret: string;
  objectKey: string;
  expiresParameter: string | null;
  signatureParameter: string | null;
}): Promise<SignatureVerification> {
  if (expiresParameter === null || signatureParameter === null) {
    return { status: "invalid" };
  }

  const expiresAtSeconds = Number(expiresParameter);

  if (!Number.isInteger(expiresAtSeconds)) {
    return { status: "invalid" };
  }

  let signatureBytes: ArrayBuffer;

  try {
    signatureBytes = decodeBase64Url(signatureParameter);
  } catch {
    return { status: "invalid" };
  }

  const signingKey = await importSigningKey(signingSecret);
  const isSignatureValid = await crypto.subtle.verify(
    SIGNATURE_ALGORITHM,
    signingKey,
    signatureBytes,
    buildSignaturePayload({ objectKey, expiresAtSeconds }),
  );

  if (!isSignatureValid) {
    return { status: "invalid" };
  }

  if (expiresAtSeconds <= Math.floor(Date.now() / 1000)) {
    return { status: "expired" };
  }

  return { status: "valid" };
}