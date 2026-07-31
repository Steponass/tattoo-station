// app/components/admin/curation/CurationFilters.tsx

import type { ArtistFilterOption } from "~/lib/gallery/galleryCurationRepository.server";
import type { PhotoCategoryFilter } from "./photoCategoryFilter";
import styles from "./CurationFilters.module.css";

/**
 * Filter panel for the curation pool. Two filters — artist and category —
 * because the pool can be large enough (400+ photos) that scroll alone is
 * unusable. The category filter names the photo's classification, not the
 * artist's role or the target gallery.
 *
 * Filters are uncontrolled from the outside: consumer passes current values
 * and a change handler; the component renders <select> elements that call
 * back on change. No internal state — the parent (the curation page) owns
 * the filter values so it can apply them to its already-in-memory photo
 * list.
 */

const CATEGORY_LABELS: Record<PhotoCategoryFilter, string> = {
  all: "All categories",
  tattoo: "Tattoo",
  piercing: "Piercing",
  flash: "Flash",
};

type CurationFiltersProps = {
  artistOptions: readonly ArtistFilterOption[];
  selectedArtistId: number | null;
  onArtistChange: (nextArtistId: number | null) => void;
  selectedCategory: PhotoCategoryFilter;
  onCategoryChange: (nextCategory: PhotoCategoryFilter) => void;
  poolCount: number;
};

export default function CurationFilters(props: CurationFiltersProps) {
  const {
    artistOptions,
    selectedArtistId,
    onArtistChange,
    selectedCategory,
    onCategoryChange,
    poolCount,
  } = props;

  function handleArtistChange(event: React.ChangeEvent<HTMLSelectElement>) {
    const rawValue = event.currentTarget.value;
    if (rawValue === "") {
      onArtistChange(null);
      return;
    }
    onArtistChange(Number(rawValue));
  }

  function handleCategoryChange(event: React.ChangeEvent<HTMLSelectElement>) {
    onCategoryChange(event.currentTarget.value as PhotoCategoryFilter);
  }

  return (
    <div className={styles.root}>
      <label className={styles.filter}>
        <span className={styles.label}>Artist</span>
        <select
          value={selectedArtistId === null ? "" : String(selectedArtistId)}
          onChange={handleArtistChange}
          className={styles.select}
        >
          <option value="">All artists</option>
          {artistOptions.map((artistOption) => (
            <option
              key={artistOption.artistId}
              value={String(artistOption.artistId)}
            >
              {artistOption.displayName}
            </option>
          ))}
        </select>
      </label>

      <label className={styles.filter}>
        <span className={styles.label}>Category</span>
        <select
          value={selectedCategory}
          onChange={handleCategoryChange}
          className={styles.select}
        >
          <option value="all">{CATEGORY_LABELS.all}</option>
          <option value="tattoo">{CATEGORY_LABELS.tattoo}</option>
          <option value="piercing">{CATEGORY_LABELS.piercing}</option>
          <option value="flash">{CATEGORY_LABELS.flash}</option>
        </select>
      </label>

      <p className={styles.count} aria-live="polite">
        {poolCount} {poolCount === 1 ? "photo" : "photos"}
      </p>
    </div>
  );
}