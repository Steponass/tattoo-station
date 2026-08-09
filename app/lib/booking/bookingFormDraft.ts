// app/lib/booking/bookingFormDraft.ts

import {
  DRAFT_ID_FIELD_NAME,
  HONEYPOT_FIELD_NAME,
  RENDERED_AT_FIELD_NAME,
  TURNSTILE_TOKEN_FIELD_NAME,
} from "./spamGuardConstants";

const STORAGE_KEY = "tattoostation:bookingFormDraft";

/**
 * Regenerated or single-use per mount, so restoring a stored value would be
 * meaningless at best and would break spam guards at worst.
 */
const EXCLUDED_FIELD_NAMES: ReadonlySet<string> = new Set([
  DRAFT_ID_FIELD_NAME,
  HONEYPOT_FIELD_NAME,
  RENDERED_AT_FIELD_NAME,
  TURNSTILE_TOKEN_FIELD_NAME,
]);

export type BookingFormDraft = Record<string, string>;

/**
 * Snapshots the booking form into sessionStorage, so a customer who navigates
 * away and back within the same tab finds their answers intact.
 *
 * Reference photos are not part of the snapshot: they upload immediately to
 * storage keyed by a draft id that is regenerated on every mount, so there is
 * nothing durable here to restore them from.
 */
export function saveBookingFormDraft(formData: FormData): void {
  if (typeof sessionStorage === "undefined") {
    return;
  }

  const draft: BookingFormDraft = {};

  for (const [fieldName, value] of formData.entries()) {
    if (EXCLUDED_FIELD_NAMES.has(fieldName) || typeof value !== "string") {
      continue;
    }

    draft[fieldName] = value;
  }

  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
  } catch {
    // Storage can be unavailable (private browsing, quota) — losing the
    // draft is harmless, so the failure is swallowed rather than surfaced.
  }
}

export function loadBookingFormDraft(): BookingFormDraft | null {
  if (typeof sessionStorage === "undefined") {
    return null;
  }

  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);

    if (raw === null) {
      return null;
    }

    return JSON.parse(raw) as BookingFormDraft;
  } catch {
    return null;
  }
}

export function clearBookingFormDraft(): void {
  if (typeof sessionStorage === "undefined") {
    return;
  }

  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // Nothing to clean up if storage is unavailable.
  }
}
