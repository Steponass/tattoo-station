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
