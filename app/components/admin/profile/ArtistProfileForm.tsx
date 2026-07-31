// app/components/admin/profile/ArtistProfileForm.tsx

import { useState } from "react";
import { useFetcher } from "react-router";
import type { ArtistProfileForEditing } from "~/lib/artists/artistRepository.server";
import type { ArtistProfilePatchFailureCode } from "~/lib/artists/artistProfilePatch.server";
import {
  CheckboxField,
  ReadOnlyField,
  TextAreaField,
  TextField,
} from "~/components/admin/form/FormFields";
import StylesPicker from "./StylesPicker";
import AvatarField from "./AvatarField";
import styles from "./ArtistProfileForm.module.css";

/**
 * The artist self-service profile editor. Renders every field in the artist's
 * loader-shaped profile: admin-only fields (slug, displayName, role, email)
 * as read-only labels; artist-editable fields (bio ×2, excerpt ×2, styles,
 * isActive, instagramHandle) as inputs.
 *
 * Submission is a fetcher, not a Form — the response is JSON, not a redirect,
 * and we want to stay on the page after save. The fetcher's response is read
 * for the success/failure state, and React Router auto-revalidates the
 * loader on any non-error action response (which reloads the profile so the
 * defaults reflect what was just saved).
 *
 * The form is uncontrolled: values collected from FormData at submit time,
 * not tracked in React state. Two scoped useStates for UX:
 *   - the "dirty" indicator (any input event flips it on)
 *   - the last-saved feedback message (a small confirmation after success)
 * StylesPicker owns its own selection state; the character counters in
 * TextAreaField do the same.
 *
 * Bio and excerpt maxLengths come from the service constants. If those change
 * server-side, this file needs the same update — a real coupling worth
 * calling out. The alternative (loader returns the limits) is worth doing
 * once a second form needs them; for one caller, importing is fine.
 */

const MAX_BIO_LENGTH = 3000;
const MAX_BIO_EXCERPT_LENGTH = 300;

type ArtistProfileFormProps = {
  artistProfile: ArtistProfileForEditing;
};

type PatchResponse =
  | { ok: true }
  | { ok: false; failureCode: string; detail: string };

/**
 * Server failure codes mapped to the field they concern. The form renders
 * the failure's detail string beneath the offending field. Failures that
 * don't map to a specific field (persist_failed, forbidden, etc.) render
 * in the form-level banner.
 */
const FIELD_FOR_FAILURE_CODE: Partial<Record<ArtistProfilePatchFailureCode, string>> = {
  bio_too_long: "bio",
  bio_excerpt_too_long: "bioExcerpt",
  instagram_handle_invalid: "instagramHandle",
  styles_not_an_array: "styles",
  styles_too_many: "styles",
  styles_unknown_value: "styles",
  unknown_locale: "bio",
};

export default function ArtistProfileForm(props: ArtistProfileFormProps) {
  const { artistProfile } = props;

  const fetcher = useFetcher<PatchResponse>();
  const isSubmitting = fetcher.state === "submitting";

  const [isDirty, setIsDirty] = useState(false);
  const [lastSaveWasSuccessful, setLastSaveWasSuccessful] = useState(false);

  const patchResponse = fetcher.data;
  const patchFailure =
    patchResponse !== undefined && !patchResponse.ok ? patchResponse : null;

  const fieldWithError =
    patchFailure !== null
      ? FIELD_FOR_FAILURE_CODE[
          patchFailure.failureCode as ArtistProfilePatchFailureCode
        ]
      : undefined;
  const formLevelError =
    patchFailure !== null && fieldWithError === undefined
      ? patchFailure.detail
      : undefined;

  function errorFor(field: string): string | undefined {
    return fieldWithError === field ? patchFailure?.detail : undefined;
  }

  const [dirtyFieldNames, setDirtyFieldNames] = useState<Set<string>>(
  () => new Set(),
);

function handleInput(event: React.FormEvent<HTMLFormElement>) {
  setIsDirty(true);
  if (lastSaveWasSuccessful) {
    setLastSaveWasSuccessful(false);
  }
  const target = event.target as HTMLElement;
  if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) {
    setDirtyFieldNames((previous) => {
      if (previous.has(target.name)) {
        return previous;
      }
      const next = new Set(previous);
      next.add(target.name);
      return next;
    });
  }
}

function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
  event.preventDefault();

  const patchBody = buildPatchBodyFromForm({
    formElement: event.currentTarget,
    dirtyFieldNames,
  });

  fetcher.submit(patchBody, {
    method: "post",
    encType: "application/json",
  });
}

  // React Router surfaces the just-completed fetcher response via
  // fetcher.data + a state transition back to "idle". Flip the confirmation
  // state when we see a successful response we haven't already acknowledged.
if (
  fetcher.state === "idle" &&
  patchResponse?.ok === true &&
  !lastSaveWasSuccessful
) {
  setLastSaveWasSuccessful(true);
  setIsDirty(false);
  setDirtyFieldNames(new Set());
}

  return (
    <fetcher.Form
      method="post"
      onSubmit={handleSubmit}
      onInput={handleInput}
      className={styles.form}
      noValidate
    >
      <section className={styles.section}>
        <h2 className={styles.sectionHeading}>Identity</h2>
        <div className={styles.fieldGrid}>
          <ReadOnlyField
            label="Display name"
            value={artistProfile.displayName}
            hint="Contact the studio to change."
          />
          <ReadOnlyField label="Slug" value={artistProfile.slug} />
          <ReadOnlyField label="Role" value={artistProfile.role} />
          <ReadOnlyField label="Email" value={artistProfile.email} />
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionHeading}>Avatar</h2>
        <AvatarField
          initialAvatar={{
            objectKey: artistProfile.profileImageKey,
            width: artistProfile.profileImageWidth,
            height: artistProfile.profileImageHeight,
          }}
        />
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionHeading}>Presence</h2>
        <div className={styles.fieldStack}>
          <CheckboxField
            name="isActive"
            label="Active on the site"
            defaultChecked={artistProfile.isActive}
            hint="When off, you don't appear on the artists page or in the booking form."
          />
          <TextField
            name="instagramHandle"
            label="Instagram handle"
            defaultValue={artistProfile.instagramHandle ?? ""}
            hint="Letters, digits, dots, underscores. No leading @."
            autoComplete="off"
            error={errorFor("instagramHandle")}
          />
<StylesPicker
  defaultSelected={artistProfile.styles}
  error={errorFor("styles")}
  onSelectionChange={() => {
    setDirtyFieldNames((previous) => {
      if (previous.has("styles")) return previous;
      const next = new Set(previous);
      next.add("styles");
      return next;
    });
    setIsDirty(true);
  }}
/>
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionHeading}>Bio — English</h2>
        <div className={styles.fieldStack}>
          <TextAreaField
            name="bio.en"
            label="Bio (English)"
            defaultValue={artistProfile.translations.en?.bio ?? ""}
            maxLength={MAX_BIO_LENGTH}
            error={errorFor("bio")}
          />
          <TextAreaField
            name="bioExcerpt.en"
            label="Excerpt (English)"
            defaultValue={artistProfile.translations.en?.bioExcerpt ?? ""}
            maxLength={MAX_BIO_EXCERPT_LENGTH}
            rows={3}
            hint="Shown on artist cards and the roster page."
            error={errorFor("bioExcerpt")}
          />
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionHeading}>Bio — Lietuviškai</h2>
        <div className={styles.fieldStack}>
          <TextAreaField
            name="bio.lt"
            label="Bio (Lithuanian)"
            defaultValue={artistProfile.translations.lt?.bio ?? ""}
            maxLength={MAX_BIO_LENGTH}
            error={errorFor("bio")}
          />
          <TextAreaField
            name="bioExcerpt.lt"
            label="Excerpt (Lithuanian)"
            defaultValue={artistProfile.translations.lt?.bioExcerpt ?? ""}
            maxLength={MAX_BIO_EXCERPT_LENGTH}
            rows={3}
            hint="Shown on artist cards and the roster page."
            error={errorFor("bioExcerpt")}
          />
        </div>
      </section>

      {formLevelError !== undefined && (
        <p role="alert" className={styles.formLevelError}>
          {formLevelError}
        </p>
      )}

      <div className={styles.actions}>
        <p className={styles.statusText} aria-live="polite">
          {getStatusText({ isDirty, isSubmitting, lastSaveWasSuccessful })}
        </p>
        <button
          type="submit"
          className={styles.submit}
          disabled={isSubmitting || !isDirty}
        >
          {isSubmitting ? "Saving…" : "Save changes"}
        </button>
      </div>
    </fetcher.Form>
  );
}

/**
 * Reads FormData from the submitted form, reshapes it into the JSON envelope
 * the API expects. Keys with dotted names ("bio.en") are split into per-locale
 * objects; the hidden styles field is parsed from JSON; the checkbox is
 * coerced to a boolean (unchecked checkboxes are absent from FormData, not
 * "false"); empty strings for instagramHandle are treated as null (explicit
 * clear).
 *
 * The reshape happens on the client because the API expects a nested body.
 * An alternative — send flat form-encoded data and reshape on the server —
 * moves this logic behind an HTTP boundary but doesn't remove it. Doing it
 * here keeps the API endpoint's contract clean (JSON in, JSON out) and
 * consistent with what a step-4 admin form will also submit.
 */
function buildPatchBodyFromForm({
  formElement,
  dirtyFieldNames,
}: {
  formElement: HTMLFormElement;
  dirtyFieldNames: Set<string>;
}): string {
  const formData = new FormData(formElement);

  const readString = (fieldName: string): string =>
    (formData.get(fieldName) ?? "").toString();

  const fields: Record<string, unknown> = {};

  if (dirtyFieldNames.has("isActive")) {
    fields.isActive = formData.get("isActive") !== null;
  }

  if (dirtyFieldNames.has("instagramHandle")) {
    const raw = readString("instagramHandle").trim();
    fields.instagramHandle = raw.length === 0 ? null : raw;
  }

  if (dirtyFieldNames.has("styles")) {
    try {
      const parsed: unknown = JSON.parse(readString("styles"));
      fields.styles = Array.isArray(parsed)
        ? parsed.filter((entry): entry is string => typeof entry === "string")
        : [];
    } catch {
      fields.styles = [];
    }
  }

  const bioByLocale: Record<string, string> = {};
  if (dirtyFieldNames.has("bio.en")) bioByLocale.en = readString("bio.en");
  if (dirtyFieldNames.has("bio.lt")) bioByLocale.lt = readString("bio.lt");
  if (Object.keys(bioByLocale).length > 0) {
    fields.bioByLocale = bioByLocale;
  }

  const bioExcerptByLocale: Record<string, string> = {};
  if (dirtyFieldNames.has("bioExcerpt.en"))
    bioExcerptByLocale.en = readString("bioExcerpt.en");
  if (dirtyFieldNames.has("bioExcerpt.lt"))
    bioExcerptByLocale.lt = readString("bioExcerpt.lt");
  if (Object.keys(bioExcerptByLocale).length > 0) {
    fields.bioExcerptByLocale = bioExcerptByLocale;
  }

  return JSON.stringify({ fields });
}

function getStatusText({
  isDirty,
  isSubmitting,
  lastSaveWasSuccessful,
}: {
  isDirty: boolean;
  isSubmitting: boolean;
  lastSaveWasSuccessful: boolean;
}): string {
  if (isSubmitting) {
    return "Saving your changes…";
  }
  if (isDirty) {
    return "You have unsaved changes.";
  }
  if (lastSaveWasSuccessful) {
    return "Saved.";
  }
  return "";
}