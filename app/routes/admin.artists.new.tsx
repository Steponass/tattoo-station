// app/routes/admin.artists.new.tsx

import { useState } from "react";
import { data, redirect, useFetcher } from "react-router";
import { getCloudflareBindings } from "~/lib/cloudflare/cloudflareContext";
import { resolveActor } from "~/lib/admin/server/resolveActor.server";
import {
  createArtist,
  type CreateArtistFailureCode,
} from "~/lib/artists/createArtist.server";
import { TextField } from "~/components/admin/form/FormFields";
import { useField } from "~/hooks/useField";
import type { Route } from "./+types/admin.artists.new";
import styles from "./admin.artists.new.module.css";

/**
 * Admin-only. Creates a new artist row plus translations. On success, the
 * response redirects to /admin/artists/:id?justCreated=1 — the edit page
 * renders the "add to Cloudflare Access" reminder banner based on the search
 * param.
 *
 * The form is minimal: only the four identity fields plus optional Instagram
 * handle. Bio content lives on the edit page — the create form's job is
 * to bring the row into existence with valid identity, not to be the full
 * profile editor.
 */

const FAILURE_STATUS: Record<CreateArtistFailureCode, number> = {
  slug_invalid: 400,
  slug_taken: 409,
  display_name_missing: 400,
  display_name_too_long: 400,
  role_invalid: 400,
  email_invalid: 400,
  email_taken: 409,
  instagram_handle_invalid: 400,
  persist_failed: 500,
};

export async function loader({ request, context }: Route.LoaderArgs) {
  const { env } = getCloudflareBindings(context);
  const actor = await resolveActor(request, env);

  if (actor.kind === "unknown") {
    throw data("Forbidden", { status: 403 });
  }

  if (actor.kind === "artist") {
    throw redirect("/admin/me");
  }

  return null;
}

export async function action({ request, context }: Route.ActionArgs) {
  const { env } = getCloudflareBindings(context);
  const actor = await resolveActor(request, env);

  if (actor.kind === "unknown") {
    return Response.json(
      { ok: false, failureCode: "forbidden", detail: "Authentication required." },
      { status: 403 },
    );
  }

  if (actor.kind !== "admin") {
    return Response.json(
      { ok: false, failureCode: "wrong_actor", detail: "Only admins can create artists." },
      { status: 403 },
    );
  }

  let parsedBody: unknown;

  try {
    parsedBody = await request.json();
  } catch {
    return Response.json(
      { ok: false, failureCode: "invalid_body", detail: "Request body was not valid JSON." },
      { status: 400 },
    );
  }

  const envelopeResult = parseCreateEnvelope(parsedBody);

  if (!envelopeResult.ok) {
    return Response.json(
      { ok: false, failureCode: envelopeResult.failureCode, detail: envelopeResult.detail },
      { status: 400 },
    );
  }

  const createResult = await createArtist({
    database: env.DB,
    slug: envelopeResult.slug,
    displayName: envelopeResult.displayName,
    role: envelopeResult.role,
    email: envelopeResult.email,
    instagramHandle: envelopeResult.instagramHandle,
  });

  if (!createResult.ok) {
    return Response.json(createResult, {
      status: FAILURE_STATUS[createResult.failureCode],
    });
  }

  // Redirect on success so the browser lands on the edit page with the
  // reminder banner. The fetcher receives the redirect and follows it; the
  // create form doesn't have to know the new artist's id.
  return redirect(`/admin/artists/${createResult.artistId}?justCreated=1`);
}

type CreateEnvelopeResult =
  | {
      ok: true;
      slug: string;
      displayName: string;
      role: "tattoo" | "piercing" | "both";
      email: string;
      instagramHandle: string | null;
    }
  | { ok: false; failureCode: string; detail: string };

function parseCreateEnvelope(body: unknown): CreateEnvelopeResult {
  if (typeof body !== "object" || body === null) {
    return {
      ok: false,
      failureCode: "invalid_body",
      detail: "Request body must be an object.",
    };
  }

  const bodyRecord = body as Record<string, unknown>;

  const slug = readString(bodyRecord.slug);
  const displayName = readString(bodyRecord.displayName);
  const roleRaw = readString(bodyRecord.role);
  const email = readString(bodyRecord.email);
  const instagramHandleRaw = readString(bodyRecord.instagramHandle);

  if (
    roleRaw !== "tattoo" &&
    roleRaw !== "piercing" &&
    roleRaw !== "both"
  ) {
    return {
      ok: false,
      failureCode: "role_invalid",
      detail: "Role must be 'tattoo', 'piercing', or 'both'.",
    };
  }

  return {
    ok: true,
    slug,
    displayName,
    role: roleRaw,
    email,
    instagramHandle: instagramHandleRaw.length === 0 ? null : instagramHandleRaw,
  };
}

function readString(value: unknown): string {
  if (typeof value !== "string") {
    return "";
  }
  return value.trim();
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

type CreateResponse =
  | { ok: true }
  | { ok: false; failureCode: string; detail: string };

const FIELD_FOR_FAILURE_CODE: Record<string, string> = {
  slug_invalid: "slug",
  slug_taken: "slug",
  display_name_missing: "displayName",
  display_name_too_long: "displayName",
  role_invalid: "role",
  email_invalid: "email",
  email_taken: "email",
  instagram_handle_invalid: "instagramHandle",
};

export default function AdminArtistNewPage() {
  const fetcher = useFetcher<CreateResponse>();
  const isSubmitting = fetcher.state === "submitting";

  const createResponse = fetcher.data;
  const createFailure =
    createResponse !== undefined && !createResponse.ok ? createResponse : null;

  const fieldWithError =
    createFailure !== null
      ? FIELD_FOR_FAILURE_CODE[createFailure.failureCode]
      : undefined;
  const formLevelError =
    createFailure !== null && fieldWithError === undefined
      ? createFailure.detail
      : undefined;

  function errorFor(field: string): string | undefined {
    return fieldWithError === field ? createFailure?.detail : undefined;
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formElement = event.currentTarget;
    const formData = new FormData(formElement);
    const readField = (fieldName: string): string =>
      (formData.get(fieldName) ?? "").toString().trim();

    const body = {
      slug: readField("slug"),
      displayName: readField("displayName"),
      role: readField("role"),
      email: readField("email"),
      instagramHandle: readField("instagramHandle"),
    };

    fetcher.submit(JSON.stringify(body), {
      method: "post",
      encType: "application/json",
    });
  }

  return (
    <main className={styles.main}>
      <header className={styles.header}>
        <h1 className={styles.heading}>New artist</h1>
        <p className={styles.subheading}>
          Creates the artist row. The artist starts inactive with empty bios —
          fill those in on the edit page and flip active when ready.
        </p>
      </header>

      <fetcher.Form
        method="post"
        onSubmit={handleSubmit}
        className={styles.form}
        noValidate
      >
        <div className={styles.fieldStack}>
          <TextField
            name="displayName"
            label="Display name"
            hint="How the artist appears on the site."
            error={errorFor("displayName")}
          />
          <TextField
            name="slug"
            label="Slug"
            hint="URL-safe. Lowercase, no spaces. Used in /artists/<slug>."
            error={errorFor("slug")}
          />
          <RoleField error={errorFor("role")} />
          <TextField
            name="email"
            label="Email"
            hint="Must be added to the Cloudflare Access policy after creation."
            autoComplete="off"
            error={errorFor("email")}
          />
          <TextField
            name="instagramHandle"
            label="Instagram handle (optional)"
            hint="Letters, digits, dots, underscores. No leading @."
            autoComplete="off"
            error={errorFor("instagramHandle")}
          />
        </div>

        {formLevelError !== undefined && (
          <p role="alert" className={styles.formLevelError}>
            {formLevelError}
          </p>
        )}

        <div className={styles.actions}>
          <button
            type="submit"
            className={styles.submit}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Creating…" : "Create artist"}
          </button>
        </div>
      </fetcher.Form>
    </main>
  );
}

/**
 * Role selector — same shape as the admin edit form. Inline because create
 * and edit are the only two callers; if a third surface ever needs a
 * SelectField primitive, we extract from one of these.
 */
type RoleFieldProps = {
  error: string | undefined;
};

function RoleField(props: RoleFieldProps) {
  const { error } = props;

  const { labelProps, controlProps, errorProps } = useField({
    name: "role",
    hasHint: false,
    hasError: error !== undefined,
  });

  return (
    <div className={styles.roleField}>
      <label {...labelProps} className={styles.roleFieldLabel}>
        Role
      </label>
      <select
        {...controlProps}
        defaultValue="tattoo"
        className={styles.roleFieldSelect}
      >
        <option value="tattoo">Tattoo</option>
        <option value="piercing">Piercing</option>
        <option value="both">Both</option>
      </select>
      {error !== undefined && (
        <p {...errorProps} className={styles.roleFieldError}>
          {error}
        </p>
      )}
    </div>
  );
}