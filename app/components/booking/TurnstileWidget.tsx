// app/components/booking/TurnstileWidget.tsx

import { Turnstile } from "@marsidev/react-turnstile";

/**
 * Renders the Turnstile widget, which injects a hidden `cf-turnstile-response`
 * input into the enclosing form.
 */
export function TurnstileWidget({
  siteKey,
  className,
}: {
  siteKey: string;
  className?: string;
}) {
  return <Turnstile siteKey={siteKey} className={className} />;
}