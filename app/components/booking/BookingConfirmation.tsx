import { useEffect, useRef } from "react";
import styles from './BookingForm.module.css'
import { useGSAP } from "@gsap/react";
import gsap from "gsap";

export type BookingConfirmationContent = {
  heading: string;
  body: string;
  referenceLabel: string;
  stampText: string;
};

const STAMP_IMPACT_ROTATION_DEGREES = -12;

export function BookingConfirmation({
  reference,
  content,
}: {
  reference: string;
  content: BookingConfirmationContent;
  className?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);

  // The submit button the customer was on becomes inert the moment this
  // renders, which would otherwise drop focus to the top of the document.
  useEffect(() => {
    containerRef.current?.focus();
  }, []);

  useGSAP(
    () => {
      const prefersReducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;

      if (prefersReducedMotion) {
        gsap.set("[data-stamp]", { autoAlpha: 1, scale: 1, rotate: STAMP_IMPACT_ROTATION_DEGREES });
        gsap.set("[data-confirmation-body]", { autoAlpha: 1 });
        return;
      }

      const timeline = gsap.timeline();

      timeline
        .fromTo(
          "[data-stamp]",
          {
            autoAlpha: 0,
            scale: 3,
            rotate: STAMP_IMPACT_ROTATION_DEGREES - 20,
          },
          {
            autoAlpha: 1,
            scale: 1,
            rotate: STAMP_IMPACT_ROTATION_DEGREES,
            duration: 0.32,
            ease: "power4.in",
          },
        )
        .to("[data-stamp]", {
          scale: 1.03,
          duration: 0.08,
          yoyo: true,
          repeat: 1,
          ease: "power2.out",
        })
        .fromTo(
          "[data-confirmation-body]",
          { autoAlpha: 0 },
          { autoAlpha: 1, delay: 1, duration: 1, ease: "power2.out" },
          "-=0.1",
        );
    },
    { scope: containerRef },
  );

  return (
    <div
      ref={containerRef}
      className={styles.booking_confirmation_overlay}
      role="status"
      aria-live="polite"
      tabIndex={-1}
    >
      {/* The circle is the stamp: it is what the timeline slams down, so the
          animation hooks sit on it and on the text that follows it in. */}
      <div className={styles.booking_confirmation_container} data-stamp>
        <h5 className={styles.confirmation_heading}>{content.heading}</h5>
        <div data-confirmation-body>
          <p>{content.body}</p>
          <p>
            {content.referenceLabel}
            <strong>{reference}</strong>
          </p>
        </div>
      </div>
    </div>
  );
}