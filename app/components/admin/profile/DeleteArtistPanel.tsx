// app/components/admin/profile/DeleteArtistPanel.tsx

import { useState } from "react";
import { useFetcher } from "react-router";
import styles from "./DeleteArtistPanel.module.css";

/**
 * Typed-confirmation delete UI. Renders a "Danger zone" section with an
 * input where the admin must type the artist's display name to enable the
 * delete button. Case-insensitive match — "Raimundas R" and "raimundas r"
 * both count; forcing exact case would frustrate legitimate deletion
 * attempts more than it would prevent misclicks.
 *
 * Delete submits to /admin/artists/:id/delete, which redirects to /admin
 * on success. Failure is shown inline; the admin can retry without
 * re-entering the confirmation (the input stays as they typed it).
 *
 * No client-side check of "does this artist have photos placed in
 * galleries?" — the cascade handles that at delete time. If the admin
 * ever wants a "this artist has N placed photos, are you sure?" warning
 * before delete, it becomes a second confirmation step. Not doing that
 * now; the typed-name confirmation is already the deliberate friction.
 */

type DeleteResponse = {
  ok: false;
  failureCode: string;
  detail: string;
};

type DeleteArtistPanelProps = {
  targetArtistId: number;
  displayName: string;
};

export default function DeleteArtistPanel(props: DeleteArtistPanelProps) {
  const { targetArtistId, displayName } = props;

  const fetcher = useFetcher<DeleteResponse>();
  const isDeleting = fetcher.state === "submitting" || fetcher.state === "loading";

  const [typedName, setTypedName] = useState("");

  const confirmationMatches =
    typedName.trim().toLowerCase() === displayName.trim().toLowerCase();

  const deleteFailure =
    fetcher.data !== undefined && !fetcher.data.ok ? fetcher.data : null;

  function handleTypedNameChange(event: React.ChangeEvent<HTMLInputElement>) {
    setTypedName(event.currentTarget.value);
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!confirmationMatches || isDeleting) {
      return;
    }

    fetcher.submit(null, {
      method: "post",
      action: `/admin/artists/${targetArtistId}/delete`,
    });
  }

  return (
    <section className={styles.dangerZone}>
      <h2 className={styles.heading}>Danger zone</h2>
      <p className={styles.body}>
        Deleting this artist removes their profile, bio, photos, avatar, and
        any gallery placements. R2 masters are swept from storage. This action
        is not reversible.
      </p>

      <fetcher.Form
        method="post"
        onSubmit={handleSubmit}
        className={styles.form}
      >
        <label className={styles.confirmationField}>
          <span className={styles.confirmationLabel}>
            Type <strong>{displayName}</strong> to confirm.
          </span>
          <input
            type="text"
            value={typedName}
            onChange={handleTypedNameChange}
            disabled={isDeleting}
            autoComplete="off"
            className={styles.confirmationInput}
          />
        </label>

        {deleteFailure !== null && (
          <p role="alert" className={styles.error}>
            {deleteFailure.detail}
          </p>
        )}

        <button
          type="submit"
          disabled={!confirmationMatches || isDeleting}
          className={styles.deleteButton}
        >
          {isDeleting ? "Deleting…" : "Delete this artist permanently"}
        </button>
      </fetcher.Form>
    </section>
  );
}