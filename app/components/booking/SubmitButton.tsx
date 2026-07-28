// app/components/booking/SubmitButton.tsx

import styles from "./SubmitButton.module.css";

export function SubmitButton({
  label,
  submittingLabel,
  isSubmitting,
  isDisabled,
}: {
  label: string;
  submittingLabel: string;
  isSubmitting: boolean;
  isDisabled: boolean;
}) {
  return (
    <button
      type="submit"
      disabled={isDisabled || isSubmitting}
      className={styles.submit_button}
      data-submit-button
      data-submitting={isSubmitting || undefined}
    >
      {isSubmitting ? submittingLabel : label}
    </button>
  );
}