// app/routes/admin._index.tsx

import { useState } from "react";
import { data, redirect } from "react-router";
import { getCloudflareBindings } from "~/lib/cloudflare/cloudflareContext";
import { resolveActor } from "~/lib/admin/server/resolveActor.server";
import {
  findAdminRoster,
  type AdminRosterEntry,
} from "~/lib/artists/artistRepository.server";
import {
  SortableGrid,
  SortableGridItem,
} from "~/components/admin/sortable/SortableGrid";
import { Link } from "react-router";
import type { Route } from "./+types/admin._index";
import styles from "./admin._index.module.css";

export async function loader({ request, context }: Route.LoaderArgs) {
  const { env } = getCloudflareBindings(context);
  const actor = await resolveActor(request, env);

  if (actor.kind === "unknown") {
    throw data("Forbidden", { status: 403 });
  }

  if (actor.kind === "artist") {
    throw redirect("/admin/me");
  }

  const rosterEntries = await findAdminRoster({ database: env.DB });

  const url = new URL(request.url);
  const justDeletedName = url.searchParams.get("deleted");

  return { rosterEntries, justDeletedName };
}

export default function AdminDashboardPage({
  loaderData,
}: Route.ComponentProps) {
  const { rosterEntries: initialRosterEntries, justDeletedName } = loaderData;

  const [rosterEntries, setRosterEntries] = useState<AdminRosterEntry[]>(() => [
    ...initialRosterEntries,
  ]);
  const [reorderErrorMessage, setReorderErrorMessage] = useState<string | null>(
    null,
  );

  const orderedArtistIds = rosterEntries.map((entry) => entry.id);

  async function handleReorder(nextOrderedIds: number[]) {
    // Snapshot the previous order so we can roll back if the server rejects
    // the new one. Optimistic UI: the list updates immediately; the server
    // catches up in the background; on failure we revert.
    const previousRosterEntries = rosterEntries;

    const nextRosterEntries = nextOrderedIds
      .map((artistId) => rosterEntries.find((entry) => entry.id === artistId))
      .filter((entry): entry is AdminRosterEntry => entry !== undefined);

    setRosterEntries(nextRosterEntries);
    setReorderErrorMessage(null);

    const persistResult = await persistRosterReorder({
      orderedArtistIds: nextOrderedIds,
    });

    if (!persistResult.ok) {
      setRosterEntries(previousRosterEntries);
      setReorderErrorMessage(persistResult.errorMessage);
    }
  }

  return (
    <main className={styles.main}>
      <header className={styles.header}>
        <h1 className={styles.heading}>Admin</h1>
      </header>

      {justDeletedName !== null && (
        <div role="status" className={styles.deletedBanner}>
          Deleted <strong>{justDeletedName}</strong>.
        </div>
      )}

      <nav aria-label="Admin sections" className={styles.sectionNav}>
        <Link to="/admin/artists/new" className={styles.sectionLink}>
          New artist
        </Link>
        <Link to="/admin/landing" className={styles.sectionLink}>
          Curate landing gallery
        </Link>
        <Link to="/admin/flash" className={styles.sectionLink}>
          Curate flash page
        </Link>
      </nav>

      <section
        aria-labelledby="roster-heading"
        className={styles.rosterSection}
      >
        <div className={styles.rosterHeader}>
          <h2 id="roster-heading" className={styles.rosterHeading}>
            Roster
          </h2>
          <p className={styles.rosterCount}>
            {rosterEntries.length}{" "}
            {rosterEntries.length === 1 ? "artist" : "artists"}
          </p>
        </div>

        {reorderErrorMessage !== null && (
          <p role="alert" className={styles.errorBanner}>
            {reorderErrorMessage}
          </p>
        )}

        {rosterEntries.length === 0 ? (
          <EmptyRoster />
        ) : (
          <SortableGrid
            orderedItemIds={orderedArtistIds}
            onOrderChange={handleReorder}
            ariaLabel="Artist roster, drag to reorder"
          >
            {rosterEntries.map((entry) => (
              <RosterEntry key={entry.id} entry={entry} />
            ))}
          </SortableGrid>
        )}
      </section>
    </main>
  );
}

function EmptyRoster() {
  return (
    <div className={styles.emptyState}>
      <p className={styles.emptyStateHeading}>No artists yet.</p>
      <p className={styles.emptyStateHint}>
        Create the first artist to get started.
      </p>
    </div>
  );
}

type RosterEntryProps = {
  entry: AdminRosterEntry;
};

/**
 * A single roster row. Wrapped in SortableGridItem for drag-to-reorder;
 * inside it, the edit link and a drag handle are separate concerns so the
 * whole row isn't a drag surface (that would fight the "click the name to
 * edit" affordance).
 */
function RosterEntry(props: RosterEntryProps) {
  const { entry } = props;

  return (
    <SortableGridItem itemId={entry.id}>
      <div className={styles.rosterEntry} data-inactive={!entry.isActive}>
        <div className={styles.dragHandle} aria-hidden="true">
          ⋮⋮
        </div>
        <Link
          to={`/admin/artists/${entry.id}`}
          className={styles.rosterEntryLink}
          onPointerDown={(event) => event.stopPropagation()}
          onKeyDown={(event) => event.stopPropagation()}
        >
          <div className={styles.rosterEntryPrimary}>
            <span className={styles.rosterEntryName}>{entry.displayName}</span>
            {!entry.isActive && (
              <span className={styles.inactiveBadge}>Inactive</span>
            )}
          </div>
          <div className={styles.rosterEntrySecondary}>
            <span className={styles.rosterEntryRole}>{entry.role}</span>
            <span className={styles.rosterEntryPhotoCount}>
              {entry.photoCount} {entry.photoCount === 1 ? "photo" : "photos"}
            </span>
          </div>
        </Link>
      </div>
    </SortableGridItem>
  );
}

// ---------------------------------------------------------------------------
// Mutation helper
// ---------------------------------------------------------------------------

type PersistResult = { ok: true } | { ok: false; errorMessage: string };

const REORDER_FAILURE_MESSAGES: Record<string, string> = {
  reorder_wrong_count: "The roster changed. Please refresh and try again.",
  reorder_unknown_ids: "The roster changed. Please refresh and try again.",
  reorder_missing_ids: "The roster is out of sync. Please refresh.",
  reorder_duplicate_ids:
    "Something went wrong with the order. Please try again.",
  persist_failed: "The new order didn't save. Please try again.",
  forbidden: "You aren't allowed to do that.",
  wrong_actor: "You aren't allowed to do that.",
};

async function persistRosterReorder({
  orderedArtistIds,
}: {
  orderedArtistIds: number[];
}): Promise<PersistResult> {
  try {
    const response = await fetch("/admin/api/reorder-roster", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderedArtistIds }),
    });

    const payload = (await response.json()) as
      { ok: true } | { ok: false; failureCode: string; detail: string };

    if (payload.ok) {
      return { ok: true };
    }

    return {
      ok: false,
      errorMessage:
        REORDER_FAILURE_MESSAGES[payload.failureCode] ??
        "The new order didn't save.",
    };
  } catch (networkError) {
    console.error("[reorder-roster] network error:", networkError);
    return {
      ok: false,
      errorMessage: "Couldn't reach the server. Check your connection.",
    };
  }
}