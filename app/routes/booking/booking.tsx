import { lazy, Suspense, useEffect } from "react";
import { useFetcher } from "react-router";

import { BookingForm } from "~/components/booking/BookingForm";
import type { BookingConfirmationContent } from "~/components/booking/BookingConfirmation";
import { findArtistContactById, findBookableArtists } from "~/lib/artists/artistRepository.server";
import { ARTIST_ROLES_BY_CATEGORY } from "~/lib/booking/bookingConstants";
import { clearBookingFormDraft } from "~/lib/booking/bookingFormDraft";
import {
  verifyBookingPhotos
} from "~/lib/booking/server/bookingPhotos.server";
import { insertBooking } from "~/lib/booking/server/bookingRepository.server";
import { checkSpamGuards } from "~/lib/booking/server/checkSpamGuards.server";
import type { BookingAttribution } from "~/lib/booking/server/bookingRepository.server";
import type {
  BookingFieldErrorCodes,
  BookingSubmission,
} from "~/lib/booking/bookingSubmissionTypes";
import { readOptionalText } from "~/lib/booking/formDataReaders";
import { generateBookingReference } from "~/lib/booking/generateBookingReference";
import { resolveArtistPreselection } from "~/lib/booking/resolveArtistPreselection";
import { sendBookingNotifications } from "~/lib/booking/server/notifications.server";
import { validateBookingSubmission } from "~/lib/booking/validateBookingSubmission";
import { getCloudflareBindings } from "~/lib/cloudflare/cloudflareContext";
import type { Route } from "./+types/booking";
import styles from './booking.module.css'

const BookingConfirmation = lazy(() =>
  import("~/components/booking/BookingConfirmation").then((module) => ({
    default: module.BookingConfirmation,
  })),
);

const bookingConfirmationContent: BookingConfirmationContent = {
  heading: "Request received",
  body: "Thanks — we've got your booking request and will be in touch shortly to confirm details.",
  referenceLabel: "Reference: ",
  stampText: "RECEIVED",
};

export type BookingActionResult =
  | { ok: true; reference: string }
  | { ok: false; fieldErrors: BookingFieldErrorCodes };

/** Resolution outcome for a specifically requested artist. */
type ArtistContactResolution =
  | { status: "resolved"; contact: Awaited<ReturnType<typeof findArtistContactById>> }
  | { status: "not_specified" }
  | { status: "invalid" };

export async function loader({ context, request }: Route.LoaderArgs) {
  const { env } = getCloudflareBindings(context);

  const artists = await findBookableArtists({ database: env.DB });
  const requestedArtistSlug = new URL(request.url).searchParams.get("artist");

  return {
    artists,
    turnstileSiteKey: env.TURNSTILE_SITE_KEY,
    artistPreselection: resolveArtistPreselection({
      artists,
      requestedArtistSlug,
    }),
  };
}

// SPLITFLAP BOARD
export const handle = {
  titleBoard: {
    show: true,
    labelKey: "booking",
    timing: { characterStaggerSeconds: 0.03, minimumFlapCount: 10 },
  },
};

/**
 * Attribution fields are populated client-side from the landing URL's query
 * string. Absent values are expected and are not validation failures.
 */
function readAttribution(formData: FormData): BookingAttribution {
  return {
    source: readOptionalText(formData, "source"),
    utmSource: readOptionalText(formData, "utmSource"),
    utmMedium: readOptionalText(formData, "utmMedium"),
    utmCampaign: readOptionalText(formData, "utmCampaign"),
  };
}

/**
 * Confirms that a specifically requested artist exists, is active, and performs
 * the requested service.
 *
 * The role check guards against a tampered submission routing a piercing
 * enquiry to a tattoo artist, which the client-side dropdown filter prevents
 * but cannot enforce.
 */
async function resolveArtistContact({
  database,
  submission,
}: {
  database: D1Database;
  submission: BookingSubmission;
}): Promise<ArtistContactResolution> {
  if (submission.artistSelection.kind === "not_specified") {
    return { status: "not_specified" };
  }

  const contact = await findArtistContactById({
    database,
    artistId: submission.artistSelection.artistId,
  });

  if (contact === null) {
    return { status: "invalid" };
  }

  const eligibleRoles: readonly string[] =
    ARTIST_ROLES_BY_CATEGORY[submission.serviceCategory];

  if (!eligibleRoles.includes(contact.role)) {
    return { status: "invalid" };
  }

  return { status: "resolved", contact };
}

export async function action({
  request,
  context,
}: Route.ActionArgs): Promise<BookingActionResult> {
  const { env, ctx } = getCloudflareBindings(context);
  const formData = await request.formData();

  // Cheapest rejections first: two field reads and one outbound request, all
  // before any parsing, database access, or object storage lookups.
  const spamGuardOutcome = await checkSpamGuards({
    formData,
    turnstileSecretKey: env.TURNSTILE_SECRET_KEY,
    remoteIpAddress: request.headers.get("cf-connecting-ip"),
  });

  if (!spamGuardOutcome.passed) {
    console.warn("[booking] rejected by spam guard:", spamGuardOutcome.reason);

    if (spamGuardOutcome.reason === "honeypot") {
      return { ok: true, reference: generateBookingReference() };
    }

    return { ok: false, fieldErrors: { form: "invalid_option" } };
  }

  const validation = validateBookingSubmission(formData);

  if (!validation.valid) {
    return { ok: false, fieldErrors: validation.fieldErrors };
  }

  const { submission } = validation;

  // Object keys arrive from the browser and are untrusted: they are confirmed
  // to belong to this submission's draft and to exist in storage.
  const { verifiedPhotos, rejectedKeys } = await verifyBookingPhotos({
    mediaBucket: env.MEDIA,
    draftId: submission.draftId,
    submittedKeys: submission.photoKeys,
  });

  if (rejectedKeys.length > 0) {
    console.warn("[booking] discarded unverifiable photo keys:", rejectedKeys);
  }

  const artistResolution = await resolveArtistContact({
    database: env.DB,
    submission,
  });

  if (artistResolution.status === "invalid") {
    return { ok: false, fieldErrors: { artistSelection: "invalid_option" } };
  }

  // Persisted before any notification is attempted, so a mail failure cannot
  // lose the enquiry.
  const persistedBooking = await insertBooking({
    database: env.DB,
    photos: verifiedPhotos,
    submission,
    attribution: readAttribution(formData),
    reference: generateBookingReference(),
  });

  // Returns the response immediately; the Worker stays alive until the three
  // notification emails settle.
  ctx.waitUntil(
    sendBookingNotifications({
      env,
      photos: verifiedPhotos,
      booking: persistedBooking,
      submission,
      artistContact:
        artistResolution.status === "resolved" ? artistResolution.contact : null,
      origin: new URL(request.url).origin,
    }),
  );

  return { ok: true, reference: persistedBooking.reference };
}

export default function BookingRoute({ loaderData }: Route.ComponentProps) {
  const { artists, turnstileSiteKey, artistPreselection } = loaderData;
  const fetcher = useFetcher<BookingActionResult>();

  const submissionResult = fetcher.data;

  // Codes rather than messages: the form resolves them to localized copy, which
  // this action cannot do because it runs without a translation context.
  const fieldErrorCodes: BookingFieldErrorCodes =
    submissionResult?.ok === false ? submissionResult.fieldErrors : {};

  useEffect(() => {
    if (submissionResult?.ok === true) {
      clearBookingFormDraft();
    }
  }, [submissionResult]);

  return (
    <main id={styles.booking_main}>
      {/*
        The form stays mounted underneath the confirmation, so the stamp lands
        on the request it confirms rather than on an empty page. It is inert
        while confirmed: there is nothing left to edit, and nothing behind an
        overlay should stay reachable by keyboard.
      */}
      <div inert={submissionResult?.ok === true}>
        <BookingForm
          key={artistPreselection?.artistSelection ?? "none"}
          artists={artists}
          turnstileSiteKey={turnstileSiteKey}
          serverFieldErrorCodes={fieldErrorCodes}
          fetcher={fetcher}
          initialSelection={artistPreselection}
        />
      </div>

      {submissionResult?.ok === true && (
        <Suspense fallback={null}>
          <BookingConfirmation
            reference={submissionResult.reference}
            content={bookingConfirmationContent}
          />
        </Suspense>
      )}
      </main>
  );
}