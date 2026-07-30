// app/components/admin/profile/StylesPicker.tsx

import { useState } from "react";
import { ARTIST_STYLES } from "~/lib/artists/artistStyles";
import styles from "./StylesPicker.module.css";

/**
 * Multi-select chip picker over the ARTIST_STYLES vocabulary. Enforces the
 * ≤5 cap client-side (the server enforces it too — this is UX, not the
 * control).
 *
 * Exports the selection into a hidden `<input name="styles">` whose value is
 * a JSON-encoded string array. The form's action parses it back on submit.
 *
 * The optional `onSelectionChange` callback lets the parent form track when
 * the styles selection has been dirtied. React does not dispatch a native
 * `input` event when we set `value` on a hidden input via React state, so
 * the form's `onInput` bubble does not catch a chip toggle — we call the
 * callback explicitly instead. Parent forms that don't need dirty tracking
 * omit the prop.
 */

const MAX_STYLES = 5;

type StylesPickerProps = {
  defaultSelected: readonly string[];
  error?: string;
  onSelectionChange?: (selectedStyles: string[]) => void;
};

export default function StylesPicker(props: StylesPickerProps) {
  const { defaultSelected, error, onSelectionChange } = props;

  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(defaultSelected),
  );

  const isAtCap = selected.size >= MAX_STYLES;

function toggleStyle(style: string) {
  const next = new Set(selected);

  if (next.has(style)) {
    next.delete(style);
  } else {
    if (selected.size >= MAX_STYLES) {
      return;
    }
    next.add(style);
  }

  setSelected(next);

  if (onSelectionChange) {
    onSelectionChange([...next]);
  }
}

  const serializedSelection = JSON.stringify([...selected]);

  return (
    <div className={styles.root}>
      <div className={styles.labelRow}>
        <p className={styles.label}>Styles</p>
        <span className={styles.counter} aria-hidden="true">
          {selected.size}/{MAX_STYLES}
        </span>
      </div>
      <ul className={styles.chipList} role="list">
        {ARTIST_STYLES.map((style) => {
          const isSelected = selected.has(style);
          const isDisabled = !isSelected && isAtCap;

          return (
            <li key={style} className={styles.chipListItem}>
              <button
                type="button"
                onClick={() => toggleStyle(style)}
                disabled={isDisabled}
                aria-pressed={isSelected}
                className={styles.chip}
                data-selected={isSelected}
              >
                {style}
              </button>
            </li>
          );
        })}
      </ul>
      <input type="hidden" name="styles" value={serializedSelection} />
      {error !== undefined && (
        <p role="alert" className={styles.error}>
          {error}
        </p>
      )}
    </div>
  );
}