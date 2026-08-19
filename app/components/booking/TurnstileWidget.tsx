import { Turnstile } from "@marsidev/react-turnstile";

/*
 * The widget injects a hidden `cf-turnstile-response`
 * input into the form.
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