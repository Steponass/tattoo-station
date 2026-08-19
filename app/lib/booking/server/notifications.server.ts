// app/lib/booking/server/notifications.server.ts

import type { BookingArtistContact } from "~/lib/artists/artistRepository.server";
import type { StoredBookingPhoto } from "./bookingPhotos.server";
import type { PersistedBooking } from "./bookingRepository.server";
import { updateNotificationStatus } from "./bookingRepository.server";
import type { BookingSubmission } from "../bookingSubmissionTypes";
import { sendEmail } from "~/lib/email/resendClient.server";
import { buildSignedMediaUrl } from "~/lib/media/signedMediaUrl.server";
import { buildCustomerConfirmationEmail } from "~/lib/email/templates/customerConfirmation";
import { buildAdminNotificationEmail } from "~/lib/email/templates/adminNotification";
import { buildArtistNotificationEmail } from "~/lib/email/templates/artistNotification";

const FROM_ADDRESS = "Tattoo Station <booking@tattoostation.lt>";
const REPLY_TO_ADDRESS = "info@tattoostation.lt";
const ADMIN_ADDRESS = "info@tattoostation.lt";

// ---------------------------------------------------------------------------
// Signed photo URL builder
// ---------------------------------------------------------------------------

/**
 * Converts a purge_after ISO timestamp to a seconds-from-now lifetime,
 * then builds a signed URL for each photo. URLs expire alongside the booking
 * row — never outlive the object they point to.
 *
 * Clamps to zero if purgeAfter is somehow already in the past, which would
 * produce an immediately-expired link rather than a negative lifetime.
 *
 * Signed independently rather than as a single Promise.all batch: a signing
 * failure (bad key, misconfigured secret, etc.) must never cost the customer,
 * admin, and artist their entire notification email over one bad photo link.
 * Failed photos are logged and simply omitted — the email templates already
 * render fine with an empty/partial photoUrls list.
 */
async function buildPhotoUrls({
  photos,
  purgeAfter,
  signingSecret,
  origin,
}: {
  photos: StoredBookingPhoto[];
  purgeAfter: string;
  signingSecret: string;
  origin: string;
}): Promise<string[]> {
  const purgeAfterSeconds = Math.floor(new Date(purgeAfter).getTime() / 1000);
  const nowSeconds = Math.floor(Date.now() / 1000);
  const lifetimeSeconds = Math.max(0, purgeAfterSeconds - nowSeconds);

  const settledUrls = await Promise.allSettled(
    photos.map((photo) =>
      buildSignedMediaUrl({
        signingSecret,
        origin,
        objectKey: photo.objectKey,
        lifetimeSeconds,
      }),
    ),
  );

  return settledUrls.flatMap((result, index) => {
    if (result.status === "fulfilled") {
      return [result.value];
    }

    console.error(
      `[notifications] failed to sign photo URL for ${photos[index].objectKey}:`,
      result.reason,
    );
    return [];
  });
}

// ---------------------------------------------------------------------------
// Outcome helpers
// ---------------------------------------------------------------------------

type SendOutcome =
  | { label: string; ok: true }
  | { label: string; ok: false; detail: string };

function resolveNotificationStatus(outcomes: SendOutcome[]): {
  status: import("./bookingRepository.server").NotificationStatus;
  failureDetail: string | undefined;
} {
  const failures = outcomes.filter((outcome) => !outcome.ok) as Extract<
    SendOutcome,
    { ok: false }
  >[];

  if (failures.length === 0) {
    return { status: "sent", failureDetail: undefined };
  }

  if (failures.length === outcomes.length) {
    const detail = failures
      .map((failure) => `${failure.label}: ${failure.detail}`)
      .join("; ");
    return { status: "failed", failureDetail: detail };
  }

  const detail = failures
    .map((failure) => `${failure.label}: ${failure.detail}`)
    .join("; ");
  return { status: "partial", failureDetail: detail };
}

// ---------------------------------------------------------------------------
// Orchestrator
// ---------------------------------------------------------------------------

export async function sendBookingNotifications({
  env,
  booking,
  submission,
  photos,
  artistContact,
  origin,
  locale,
}: {
  env: Env;
  booking: PersistedBooking;
  submission: BookingSubmission;
  photos: StoredBookingPhoto[];
  artistContact: BookingArtistContact | null;
  origin: string;
  locale: string | undefined;
}): Promise<void> {
  try {
    const photoUrls = await buildPhotoUrls({
      photos,
      purgeAfter: booking.purgeAfter,
      signingSecret: env.MEDIA_URL_SIGNING_SECRET,
      origin,
    });

    // Build all three email payloads upfront before any sends.
    const customerEmail = buildCustomerConfirmationEmail({
      customerName: submission.customerName,
      reference: booking.reference,
      submission,
      locale: locale ?? "en",
    });

    const adminEmail = buildAdminNotificationEmail({
      customerName: submission.customerName,
      customerEmail: submission.customerEmail,
      customerPhone: submission.customerPhone,
      reference: booking.reference,
      submission,
      artistName: artistContact?.displayName ?? null,
      photoUrls,
    });

    const artistEmail =
      artistContact !== null
        ? buildArtistNotificationEmail({
            artistName: artistContact.displayName,
            customerName: submission.customerName,
            customerEmail: submission.customerEmail,
            customerPhone: submission.customerPhone,
            reference: booking.reference,
            submission,
            photoUrls,
          })
        : null;

    // Fire all applicable sends concurrently. allSettled so one failure
    // never cancels the others — each result is inspected individually.
    const sendPromises: Promise<SendOutcome>[] = [
      sendEmail({
        apiKey: env.RESEND_API_KEY,
        payload: {
          to: submission.customerEmail,
          from: FROM_ADDRESS,
          replyTo: REPLY_TO_ADDRESS,
          subject: customerEmail.subject,
          html: customerEmail.html,
        },
      }).then((result) => ({ label: "customer", ...result })),

      sendEmail({
        apiKey: env.RESEND_API_KEY,
        payload: {
          to: ADMIN_ADDRESS,
          from: FROM_ADDRESS,
          replyTo: submission.customerEmail,
          subject: adminEmail.subject,
          html: adminEmail.html,
        },
      }).then((result) => ({ label: "admin", ...result })),
    ];

    if (artistEmail !== null && artistContact !== null) {
      sendPromises.push(
        sendEmail({
          apiKey: env.RESEND_API_KEY,
          payload: {
            to: artistContact.email,
            from: FROM_ADDRESS,
            replyTo: submission.customerEmail,
            subject: artistEmail.subject,
            html: artistEmail.html,
          },
        }).then((result) => ({ label: "artist", ...result })),
      );
    }

    const settledResults = await Promise.allSettled(sendPromises);

    // Promise.allSettled only rejects if the promise itself throws, which
    // sendEmail never does — but we handle it defensively anyway.
    const outcomes: SendOutcome[] = settledResults.map((result) => {
      if (result.status === "fulfilled") {
        return result.value;
      }
      return {
        label: "unknown",
        ok: false,
        detail: result.reason instanceof Error ? result.reason.message : "Unexpected error",
      };
    });

    const { status, failureDetail } = resolveNotificationStatus(outcomes);

    if (status !== "sent") {
      console.error("[notifications] send failures:", failureDetail);
    }

    try {
      await updateNotificationStatus({
        database: env.DB,
        bookingId: booking.id,
        status,
        failureDetail,
      });
    } catch (dbError) {
      // The booking is already persisted — a status update failure is logged
      // but never rethrown, since there is nothing left to do here.
      console.error("[notifications] failed to update notification_status:", dbError);
    }
  } catch (error) {
    // Defense-in-depth: catches anything that throws before the normal
    // per-outcome status resolution above runs. Without this, a throw here
    // (this whole function runs inside ctx.waitUntil with no caller to
    // report to) leaves notification_status stuck on 'pending' forever with
    // no record of what happened — which is exactly how photo bookings went
    // silently unnotified when the media signing secret was misconfigured.
    const detail = error instanceof Error ? error.message : "Unexpected error";
    console.error(
      "[notifications] unhandled error while sending booking notifications:",
      error,
    );

    try {
      await updateNotificationStatus({
        database: env.DB,
        bookingId: booking.id,
        status: "failed",
        failureDetail: detail,
      });
    } catch (dbError) {
      console.error(
        "[notifications] failed to update notification_status after unhandled error:",
        dbError,
      );
    }
  }
}