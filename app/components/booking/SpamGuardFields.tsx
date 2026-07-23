import {useRef } from "react";

import {
  DRAFT_ID_FIELD_NAME,
  HONEYPOT_FIELD_NAME,
  RENDERED_AT_FIELD_NAME,
} from "~/lib/booking/spamGuardConstants";


/**
 * Passive anti-spam inputs: a honeypot, a render timestamp, and the draft id
 * scoping this submission's uploaded photos.
 *
 * The honeypot is hidden with CSS rather than `display: none` or a hidden input
 * type, both of which are trivially detected. `autocomplete="one-time-code"`
 * prevents password managers and browser autofill from populating it, which is
 * the most common source of false positives.
 */
export function SpamGuardFields({
  draftId,
}: {
  draftId: string;
}) {
  const renderedAtRef = useRef<string>(String(Date.now()));

  return (
    <div style={{ position: "absolute", visibility: "hidden"}} data-spam-guard aria-hidden="true">
      <label htmlFor={HONEYPOT_FIELD_NAME}>
        Company name
        <input
          id={HONEYPOT_FIELD_NAME}
          name={HONEYPOT_FIELD_NAME}
          type="text"
          tabIndex={-1}
          autoComplete="one-time-code"
          defaultValue=""
        />
      </label>

      <input
        type="hidden"
        name={RENDERED_AT_FIELD_NAME}
        value={renderedAtRef.current}
      />

      <input type="hidden" name={DRAFT_ID_FIELD_NAME} value={draftId} />
    </div>
  );
}