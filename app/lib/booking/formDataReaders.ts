/**
 * Primitives for reading FormData, which yields `File | string | null` for
 * every key regardless of the control that produced it.
 *
 * These normalize on the way out: absent, empty, and whitespace-only values all
 * become `undefined`, so callers test one condition rather than three.
 */

export function readOptionalText(
  formData: FormData,
  fieldName: string,
): string | undefined {
  const rawValue = formData.get(fieldName);

  if (typeof rawValue !== "string") {
    return undefined;
  }

  const trimmedValue = rawValue.trim();

  return trimmedValue.length === 0 ? undefined : trimmedValue;
}

/** Checkboxes submit their value only when checked, and are absent otherwise. */
export function readCheckbox(formData: FormData, fieldName: string): boolean {
  return formData.get(fieldName) === "on";
}

export function readTextList(formData: FormData, fieldName: string): string[] {
  return formData
    .getAll(fieldName)
    .filter((value): value is string => typeof value === "string")
    .map((value) => value.trim())
    .filter((value) => value.length > 0);
}


export function isValidEmailShape(value: string): boolean {
  // Deliberately permissive: full RFC 5322 conformance rejects addresses that
  // work in practice, and the only real proof of a working address is delivery.
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value);
}

export function isValidPhoneShape(value: string): boolean {
  const digitCount = value.replace(/\D/g, "").length;
  const hasOnlyAllowedCharacters = /^[+()\d\s./-]+$/.test(value);

  return hasOnlyAllowedCharacters && digitCount >= 6 && digitCount <= 15;
}

export function isValidHttpUrl(value: string): boolean {
  try {
    const parsedUrl = new URL(value);
    return parsedUrl.protocol === "http:" || parsedUrl.protocol === "https:";
  } catch {
    return false;
  }
}