// app/lib/booking/server/verifyTurnstileToken.server.ts

const TURNSTILE_VERIFY_URL =
  "https://challenges.cloudflare.com/turnstile/v0/siteverify";

type TurnstileVerifyResponse = {
  success: boolean;
  "error-codes"?: string[];
};

/**
 * Verifies a Turnstile token with Cloudflare's siteverify endpoint.
 *
 * Returns false on network failure rather than throwing: a Turnstile outage
 * should reject submissions rather than surface a server error, and the
 * rejection is logged so the cause is visible.
 */
export async function verifyTurnstileToken({
  secretKey,
  token,
  remoteIpAddress,
}: {
  secretKey: string;
  token: string | undefined;
  remoteIpAddress: string | null;
}): Promise<boolean> {
  if (token === undefined || token.length === 0) {
    return false;
  }

  const requestBody = new FormData();
  requestBody.set("secret", secretKey);
  requestBody.set("response", token);

  if (remoteIpAddress !== null) {
    requestBody.set("remoteip", remoteIpAddress);
  }

  try {
    const response = await fetch(TURNSTILE_VERIFY_URL, {
      method: "POST",
      body: requestBody,
    });

    const verification = (await response.json()) as TurnstileVerifyResponse;

    if (!verification.success) {
      console.warn(
        "[turnstile] verification failed",
        verification["error-codes"],
      );
    }

    return verification.success;
  } catch (error) {
    console.error("[turnstile] verification request failed", error);
    return false;
  }
}