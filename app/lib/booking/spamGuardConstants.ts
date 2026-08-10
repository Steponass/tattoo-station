// app/lib/booking/spamGuardConstants.ts

/**
 * Field names for the passive spam checks. Deliberately plausible-looking so
 * they blend into the form; bots increasingly recognise names like "url" or
 * "website" as honeypots and leave them empty.
 */
export const HONEYPOT_FIELD_NAME = "companyName";

export const RENDERED_AT_FIELD_NAME = "renderedAt";

export const DRAFT_ID_FIELD_NAME = "draftId";

export const TURNSTILE_TOKEN_FIELD_NAME = "cf-turnstile-response";

export const LOCALE_FIELD_NAME = "locale";

/**
 * A human cannot complete this form in under three seconds. Checked server-side
 * against the signed-in-plain-text timestamp rendered with the form.
 */
export const MINIMUM_COMPLETION_SECONDS = 8;