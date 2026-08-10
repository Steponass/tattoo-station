// app/lib/booking/server/bookingRepository.server.ts

import type { StoredBookingPhoto } from "./bookingPhotos.server";
import type { BookingSubmission } from "../bookingSubmissionTypes";

export const BOOKING_RETENTION_DAYS = 40;

export type BookingAttribution = {
  source?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
};

export type PersistedBooking = {
  id: string;
  reference: string;
  createdAt: string;
  purgeAfter: string;
};

export type NotificationStatus = "pending" | "sent" | "partial" | "failed";

const INSERT_BOOKING_SQL = `
  INSERT INTO bookings (
    id, reference, draft_id, created_at, purge_after,
    customer_name, customer_email, customer_phone,
    service_category, service_type, artist_selection, artist_id, preferred_times,
    description, body_placement, reference_link,
    preferred_style, approx_size_cm, budget_range, photos,
    is_first_time, marketing_consent, privacy_consent_at,
    source, utm_source, utm_medium, utm_campaign,
    notification_status
  ) VALUES (
    ?, ?, ?, ?, ?,
    ?, ?, ?,
    ?, ?, ?, ?, ?,
    ?, ?, ?,
    ?, ?, ?, ?,
    ?, ?, ?,
    ?, ?, ?, ?,
    'pending'
  )
`;

function addDays(date: Date, dayCount: number): Date {
  const result = new Date(date);
  result.setUTCDate(result.getUTCDate() + dayCount);
  return result;
}

/**
 * Tattoo-only fields are absent from the other submission branches, so they are
 * read through a narrowing check rather than optional property access.
 */
function extractTattooFields(submission: BookingSubmission) {
  if (submission.serviceCategory !== "tattoo") {
    return { preferredStyle: null, approxSizeCm: null, budgetRange: null };
  }

  return {
    preferredStyle: submission.preferredStyle ?? null,
    approxSizeCm: submission.approxSizeCm ?? null,
    budgetRange: submission.budgetRange ?? null,
  };
}

function extractBodyPlacement(submission: BookingSubmission): string | null {
  return submission.serviceCategory === "other"
    ? null
    : submission.bodyPlacement;
}

/**
 * Writes a validated booking before any notification is attempted, so that a
 * mail delivery failure cannot lose the enquiry.
 */
export async function insertBooking({
  database,
  submission,
  photos,
  attribution,
  reference,
}: {
  database: D1Database;
  submission: BookingSubmission;
  photos: StoredBookingPhoto[];
  attribution: BookingAttribution;
  reference: string;
}): Promise<PersistedBooking> {
  const bookingId = crypto.randomUUID();
  const createdAtDate = new Date();
  const createdAt = createdAtDate.toISOString();
  const purgeAfter = addDays(createdAtDate, BOOKING_RETENTION_DAYS).toISOString();

  const { preferredStyle, approxSizeCm, budgetRange } =
    extractTattooFields(submission);

  const artistId =
    submission.artistSelection.kind === "specific"
      ? submission.artistSelection.artistId
      : null;

  await database
    .prepare(INSERT_BOOKING_SQL)
    .bind(
      bookingId,
      reference,
      submission.draftId,
      createdAt,
      purgeAfter,
      submission.customerName,
      submission.customerEmail,
      submission.customerPhone,
      submission.serviceCategory,
      submission.serviceType,
      submission.artistSelection.kind,
      artistId,
      submission.preferredTimes ?? null,
      submission.description,
      extractBodyPlacement(submission),
      submission.referenceLink ?? null,
      preferredStyle,
      approxSizeCm,
      budgetRange,
      JSON.stringify(photos),
      submission.isFirstTime ? 1 : 0,
      submission.marketingConsent ? 1 : 0,
      createdAt, // privacy_consent_at: consent is required at submit time, so it coincides with creation.
      attribution.source ?? null,
      attribution.utmSource ?? null,
      attribution.utmMedium ?? null,
      attribution.utmCampaign ?? null,
    )
    .run();

  return { id: bookingId, reference, createdAt, purgeAfter };
}

const UPDATE_NOTIFICATION_STATUS_SQL = `
  UPDATE bookings
  SET notification_status = ?, notification_error = ?
  WHERE id = ?
`;

export async function updateNotificationStatus({
  database,
  bookingId,
  status,
  failureDetail,
}: {
  database: D1Database;
  bookingId: string;
  status: NotificationStatus;
  failureDetail?: string;
}): Promise<void> {
  await database
    .prepare(UPDATE_NOTIFICATION_STATUS_SQL)
    .bind(status, failureDetail ?? null, bookingId)
    .run();
}