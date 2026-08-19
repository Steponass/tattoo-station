import { useRef } from "react";
import { useLocale } from "react-intlayer";

import {
  DRAFT_ID_FIELD_NAME,
  HONEYPOT_FIELD_NAME,
  RENDERED_AT_FIELD_NAME,
} from "~/lib/booking/spamGuardConstants";

export function SpamGuardFields({
  draftId,
}: {
  draftId: string;
}) {
  const renderedAtRef = useRef<string>(String(Date.now()));
  const { locale } = useLocale();

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
      <input type="hidden" name="locale" value={locale} />
    </div>
  );
}