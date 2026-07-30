// app/lib/booking/useBookingFormValidation.ts

import { useCallback, useState } from "react";

import type { BookingFieldErrorCodes } from "./bookingSubmissionTypes";
import { validateBookingSubmission } from "./validateBookingSubmission";

/**
 * Controls that can hold a value and receive focus. Hidden inputs are excluded
 * because focusing one silently does nothing, which would strand the customer
 * with no visible cursor after a failed submit.
 */
const FOCUSABLE_CONTROL_SELECTOR =
  'input[name]:not([type="hidden"]), select[name], textarea[name]';

/**
 * Moves focus to the first control the customer can actually fix.
 *
 * Walks the DOM rather than a declared field order, which handles the form's
 * progressive disclosure for free: fields that are not mounted yet — and the
 * hidden draft id — simply are not found, and their errors are left to the
 * form-level message instead.
 */
function focusFirstInvalidControl(
  form: HTMLFormElement,
  fieldErrorCodes: BookingFieldErrorCodes,
): void {
  const controls = Array.from(
    form.querySelectorAll<HTMLElement>(FOCUSABLE_CONTROL_SELECTOR),
  );

  const firstInvalidControl = controls.find((control) => {
    const fieldName = control.getAttribute("name");

    return fieldName !== null && fieldErrorCodes[fieldName] !== undefined;
  });

  firstInvalidControl?.focus();
}

/**
 * Client-side validation for the booking form.
 *
 * Runs the same `validateBookingSubmission` the action runs, against a snapshot
 * of the live form, so the browser and the server can never disagree about what
 * is wrong. Nothing is flagged while the form is being filled in: the first
 * submit attempt reveals every problem at once, and from then on each keystroke
 * or blur re-runs the check so a fixed field clears itself immediately.
 */
export function useBookingFormValidation({
  serverFieldErrorCodes,
}: {
  serverFieldErrorCodes: BookingFieldErrorCodes;
}) {
  /**
   * `null` until a submit is attempted, which doubles as the flag for whether
   * errors are allowed to show at all.
   */
  const [submitAttemptErrorCodes, setSubmitAttemptErrorCodes] =
    useState<BookingFieldErrorCodes | null>(null);

  // A local result supersedes the server's, because it reflects the form as it
  // stands now rather than as it was when the rejected request was sent.
  const fieldErrorCodes = submitAttemptErrorCodes ?? serverFieldErrorCodes;

  const handleSubmit = useCallback(
    (event: React.FormEvent<HTMLFormElement>) => {
      const form = event.currentTarget;
      const validation = validateBookingSubmission(new FormData(form));

      if (validation.valid) {
        // Hand display back to the server round trip, so a rejection it alone
        // can detect — an artist who no longer takes this service, a failed
        // spam guard — is not masked by this stale pass.
        setSubmitAttemptErrorCodes(null);
        return;
      }

      event.preventDefault();
      setSubmitAttemptErrorCodes(validation.fieldErrors);
      focusFirstInvalidControl(form, validation.fieldErrors);
    },
    [],
  );

  /**
   * Delegated from the form element: both `input` and `blur` bubble, so every
   * control is covered without threading a handler through each field.
   */
  const handleRevalidate = useCallback(
    (event: React.SyntheticEvent<HTMLFormElement>) => {
      // Before the first submit attempt there is nothing on screen to update,
      // and flagging fields mid-typing would be premature.
      if (submitAttemptErrorCodes === null) {
        return;
      }

      const validation = validateBookingSubmission(
        new FormData(event.currentTarget),
      );

      setSubmitAttemptErrorCodes(validation.valid ? {} : validation.fieldErrors);
    },
    [submitAttemptErrorCodes],
  );

  return {
    fieldErrorCodes,
    hasVisibleErrors: Object.keys(fieldErrorCodes).length > 0,
    handleSubmit,
    handleRevalidate,
  };
}
