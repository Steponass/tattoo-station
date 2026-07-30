// app/components/admin/form/FormFields.tsx

/**
 * The form primitives for the admin area. Colocated in one file because
 * they share the same shape (label + control + hint + error slots wired
 * through useField) and the same stylesheet, and reading them side by side
 * makes their consistency easier to enforce than four small files would.
 *
 * If a primitive here grows substantially — say, TextAreaField gains
 * autosize + toolbar + inline-formatting logic — split that one out. The
 * bar for splitting is "this primitive stopped fitting alongside its
 * siblings," not "we have four things in one file."
 *
 * All primitives are uncontrolled. The parent form reads submitted values
 * off FormData. Live behaviors (character counter, dirty tracking) are
 * added at the caller with onInput handlers or scoped state — the
 * primitives stay simple.
 */

import { useState } from "react";
import { useField } from "~/hooks/useField";
import styles from "./FormFields.module.css";

// ---------------------------------------------------------------------------
// TextField
// ---------------------------------------------------------------------------

type TextFieldProps = {
  name: string;
  label: string;
  defaultValue?: string;
  hint?: string;
  error?: string;
  autoComplete?: string;
  onInput?: (event: React.FormEvent<HTMLInputElement>) => void;
};

export function TextField(props: TextFieldProps) {
  const {
    name,
    label,
    defaultValue,
    hint,
    error,
    autoComplete,
    onInput,
  } = props;

  const { labelProps, controlProps, hintProps, errorProps } = useField({
    name,
    hasHint: hint !== undefined,
    hasError: error !== undefined,
  });

  return (
    <div className={styles.root}>
      <label {...labelProps} className={styles.label}>
        {label}
      </label>
      <input
        {...controlProps}
        type="text"
        defaultValue={defaultValue}
        autoComplete={autoComplete}
        onInput={onInput}
        className={styles.control}
      />
      {hint !== undefined && (
        <p {...hintProps} className={styles.hint}>
          {hint}
        </p>
      )}
      {error !== undefined && (
        <p {...errorProps} className={styles.error}>
          {error}
        </p>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// TextAreaField
// ---------------------------------------------------------------------------

/**
 * The counter is display-only. The textarea itself remains uncontrolled — its
 * value is read off FormData on submit. The counter tracks length in a scoped
 * `useState` updated on `onInput`. This is the pattern for "add live UX to an
 * uncontrolled input without controlling it": component-local state that
 * shadows the real value, updated by the same input event the browser fires.
 *
 * `maxLength` is enforced by the browser too, so the counter and the input
 * cannot disagree at submit time — the input caps at maxLength before the
 * counter can exceed it.
 */

type TextAreaFieldProps = {
  name: string;
  label: string;
  defaultValue?: string;
  hint?: string;
  error?: string;
  maxLength: number;
  rows?: number;
};

export function TextAreaField(props: TextAreaFieldProps) {
  const {
    name,
    label,
    defaultValue,
    hint,
    error,
    maxLength,
    rows,
  } = props;

  const { labelProps, controlProps, hintProps, errorProps } = useField({
    name,
    hasHint: hint !== undefined,
    hasError: error !== undefined,
  });

  const [currentLength, setCurrentLength] = useState(
    defaultValue?.length ?? 0,
  );

  function handleInput(event: React.FormEvent<HTMLTextAreaElement>) {
    setCurrentLength(event.currentTarget.value.length);
  }

  return (
    <div className={styles.root}>
      <div className={styles.labelRow}>
        <label {...labelProps} className={styles.label}>
          {label}
        </label>
        <span className={styles.counter} aria-hidden="true">
          {currentLength}/{maxLength}
        </span>
      </div>
      <textarea
        {...controlProps}
        defaultValue={defaultValue}
        maxLength={maxLength}
        rows={rows ?? 6}
        onInput={handleInput}
        className={styles.textAreaControl}
      />
      {hint !== undefined && (
        <p {...hintProps} className={styles.hint}>
          {hint}
        </p>
      )}
      {error !== undefined && (
        <p {...errorProps} className={styles.error}>
          {error}
        </p>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// CheckboxField
// ---------------------------------------------------------------------------

type CheckboxFieldProps = {
  name: string;
  label: string;
  defaultChecked?: boolean;
  hint?: string;
};

export function CheckboxField(props: CheckboxFieldProps) {
  const { name, label, defaultChecked, hint } = props;

  const { labelProps, controlProps, hintProps } = useField({
    name,
    hasHint: hint !== undefined,
    hasError: false,
  });

  return (
    <div className={styles.root}>
      <div className={styles.checkboxRow}>
        <input
          {...controlProps}
          type="checkbox"
          defaultChecked={defaultChecked}
          className={styles.checkboxControl}
        />
        <label {...labelProps} className={styles.label}>
          {label}
        </label>
      </div>
      {hint !== undefined && (
        <p {...hintProps} className={styles.hint}>
          {hint}
        </p>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// ReadOnlyField
// ---------------------------------------------------------------------------

/**
 * Label + text pair for fields the current actor cannot edit. Not an input,
 * not a `<input readonly>`, not a `<input disabled>` — just presentational,
 * because it isn't submitted and shouldn't look interactive.
 *
 * Rendering `slug`, `role`, `email`, `displayName` this way for artist actors
 * is clearer than a disabled input, which invites the "why can't I edit
 * this?" question every time. A label with a value obviously communicates
 * "this is a fact about you, not a field to fill in."
 */

type ReadOnlyFieldProps = {
  label: string;
  value: string;
  hint?: string;
};

export function ReadOnlyField(props: ReadOnlyFieldProps) {
  const { label, value, hint } = props;

  return (
    <div className={styles.root}>
      <p className={styles.readOnlyLabel}>{label}</p>
      <p className={styles.readOnlyValue}>{value}</p>
      {hint !== undefined && <p className={styles.hint}>{hint}</p>}
    </div>
  );
}