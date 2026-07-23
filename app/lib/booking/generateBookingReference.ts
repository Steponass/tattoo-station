// app/lib/booking/generateBookingReference.ts

/**
 * Excludes characters that are misread aloud or mistyped: 0/O, 1/I/L, and U.
 * References are read over the phone, so ambiguity is a real cost.
 */
const UNAMBIGUOUS_ALPHABET = "23456789ABCDEFGHJKMNPQRSTVWXYZ";

const RANDOM_SUFFIX_LENGTH = 4;

function formatDateSegment(date: Date): string {
  const year = String(date.getUTCFullYear()).slice(-2);
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");

  return `${year}${month}${day}`;
}

function generateRandomSuffix(): string {
  const randomBytes = crypto.getRandomValues(
    new Uint8Array(RANDOM_SUFFIX_LENGTH),
  );

  return Array.from(randomBytes, (byte) =>
    UNAMBIGUOUS_ALPHABET.charAt(byte % UNAMBIGUOUS_ALPHABET.length),
  ).join("");
}

/**
 * Builds a human-readable booking reference, e.g. `260721-K4M2`.
 *
 * The date prefix lets staff place an enquiry at a glance; the random suffix
 * prevents collisions and keeps references non-enumerable.
 */
export function generateBookingReference(date: Date = new Date()): string {
  return `${formatDateSegment(date)}-${generateRandomSuffix()}`;
}