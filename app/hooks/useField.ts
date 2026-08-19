import { useId } from "react";

/*
 * Field-plumbing hook. Consolidates the id-linking, ARIA wiring, and
 * hint/error slot conventions that every labeled input in the admin area
 * needs, so field primitives are markup plus the return of this hook —
 * no per-primitive re-implementation of "which id goes on which element."
 *
 * The hook returns four prop bundles, meant to be spread onto flat markup:
 *
 * ARIA:
 *   - the label's `htmlFor` points at the control's id
 *   - the control's `aria-describedby` includes the hint's id when a hint
 *     exists; otherwise the attribute is omitted (empty attributes are noise
 *     for screen readers)
 *   - the control's `aria-invalid` is set when an error is present, and its
 *     `aria-errormessage` points at the error's id
 *   - the error element uses `role="alert"` so it announces on change,
 *     rather than only on focus
 */

export type FieldConfig = {
  name: string;
  hasHint: boolean;
  hasError: boolean;
};

export type FieldSlots = {
  labelProps: { htmlFor: string };
  controlProps: {
    id: string;
    name: string;
    "aria-describedby"?: string;
    "aria-invalid"?: true;
    "aria-errormessage"?: string;
  };
  hintProps: { id: string };
  errorProps: { id: string; role: "alert" };
};

export function useField(config: FieldConfig): FieldSlots {
  const generatedId = useId();
  const controlId = `${generatedId}-${config.name}`;
  const hintId = `${controlId}-hint`;
  const errorId = `${controlId}-error`;

  const describedByIds: string[] = [];

  if (config.hasHint) {
    describedByIds.push(hintId);
  }

  const controlProps: FieldSlots["controlProps"] = {
    id: controlId,
    name: config.name,
  };

  if (describedByIds.length > 0) {
    controlProps["aria-describedby"] = describedByIds.join(" ");
  }

  if (config.hasError) {
    controlProps["aria-invalid"] = true;
    controlProps["aria-errormessage"] = errorId;
  }

  return {
    labelProps: { htmlFor: controlId },
    controlProps,
    hintProps: { id: hintId },
    errorProps: { id: errorId, role: "alert" },
  };
}