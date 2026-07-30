// app/components/booking/FieldError.tsx

/**
 * The error message belonging to one field.
 *
 * The id is derived from the field name so a control can point at its own
 * message with `aria-describedby` without either side inventing an id.
 */
export function fieldErrorElementId(fieldName: string): string {
  return `${fieldName}-error`;
}

export function FieldError({
  fieldName,
  message,
}: {
  fieldName: string;
  message: string | undefined;
}) {
  if (message === undefined) {
    return null;
  }

  return (
    <p id={fieldErrorElementId(fieldName)} data-field-error role="alert">
      {message}
    </p>
  );
}
