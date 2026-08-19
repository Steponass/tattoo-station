import styles from "./BookingForm.module.css";

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
      className={`${styles.submit_button} chamfer chamfer-xs punch button_a`}
      data-submit-button
      data-submitting={isSubmitting || undefined}
    >
      {isSubmitting ? submittingLabel : label}
    </button>
  );
}