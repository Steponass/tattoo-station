// app/lib/booking/server/checkSpamGuards.server.ts

import {
  HONEYPOT_FIELD_NAME,
  MINIMUM_COMPLETION_SECONDS,
  RENDERED_AT_FIELD_NAME,
  TURNSTILE_TOKEN_FIELD_NAME,
} from "../spamGuardConstants";
import { readOptionalText } from "../formDataReaders";
import { verifyTurnstileToken } from "./verifyTurnstileToken.server";

export type SpamGuardOutcome =
  | { passed: true }
  | { passed: false; reason: "honeypot" | "too_fast" | "turnstile" };

/**
 * Evaluates the passive spam checks before any parsing or I/O.
 *
 * Ordered cheapest first so that a flood of automated submissions costs almost
 * nothing: two field reads before the single outbound request.
 */
export async function checkSpamGuards({
  formData,
  turnstileSecretKey,
  remoteIpAddress,
}: {
  formData: FormData;
  turnstileSecretKey: string;
  remoteIpAddress: string | null;
}): Promise<SpamGuardOutcome> {
  const honeypotValue = readOptionalText(formData, HONEYPOT_FIELD_NAME);

  if (honeypotValue !== undefined) {
    return { passed: false, reason: "honeypot" };
  }

  if (!hasPlausibleCompletionTime(formData)) {
    return { passed: false, reason: "too_fast" };
  }

  const isTokenValid = await verifyTurnstileToken({
    secretKey: turnstileSecretKey,
    token: readOptionalText(formData, TURNSTILE_TOKEN_FIELD_NAME),
    remoteIpAddress,
  });

  if (!isTokenValid) {
    return { passed: false, reason: "turnstile" };
  }

  return { passed: true };
}

/**
 * The timestamp is client-supplied and therefore forgeable. This is a cheap
 * filter against bots that submit without rewriting hidden fields, not a
 * control — Turnstile is the control.
 */
function hasPlausibleCompletionTime(formData: FormData): boolean {
  const rawRenderedAt = readOptionalText(formData, RENDERED_AT_FIELD_NAME);

  if (rawRenderedAt === undefined) {
    return false;
  }

  const renderedAtMilliseconds = Number(rawRenderedAt);

  if (!Number.isFinite(renderedAtMilliseconds)) {
    return false;
  }

  const elapsedSeconds = (Date.now() - renderedAtMilliseconds) / 1000;

  return elapsedSeconds >= MINIMUM_COMPLETION_SECONDS;
}