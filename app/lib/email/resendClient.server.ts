// app/lib/email/resendClient.server.ts

const RESEND_API_URL = "https://api.resend.com/emails";

export type EmailPayload = {
  to: string;
  from: string;
  replyTo: string;
  subject: string;
  html: string;
};

export type SendEmailResult =
  | { ok: true }
  | { ok: false; detail: string };

/**
 * Sends a single transactional email via the Resend API using a raw fetch.
 *
 * Returns a discriminated result rather than throwing — the notifications
 * orchestrator collects all three outcomes via Promise.allSettled and decides
 * what to write to D1. Network failures and non-2xx responses are both mapped
 * to { ok: false }.
 */
export async function sendEmail({
  apiKey,
  payload,
}: {
  apiKey: string;
  payload: EmailPayload;
}): Promise<SendEmailResult> {
  const requestBody = JSON.stringify({
    to: payload.to,
    from: payload.from,
    reply_to: payload.replyTo,
    subject: payload.subject,
    html: payload.html,
  });

  let response: Response;

  try {
    response = await fetch(RESEND_API_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: requestBody,
    });
  } catch (networkError) {
    const detail = networkError instanceof Error
      ? networkError.message
      : "Network request failed";

    return { ok: false, detail };
  }

  if (response.ok) {
    return { ok: true };
  }

  // Resend returns error detail in the response body as JSON.
  // Best-effort parse — if it fails, we fall back to the HTTP status text.
  try {
    const errorBody = await response.json() as { message?: string };
    const detail = errorBody.message ?? response.statusText;
    return { ok: false, detail: `${response.status} ${detail}` };
  } catch {
    return { ok: false, detail: `${response.status} ${response.statusText}` };
  }
}