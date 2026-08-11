import { useEffect, useRef } from "react";
import styles from './BookingForm.module.css'
import { useGSAP } from "@gsap/react";
import gsap from "gsap";

export type BookingConfirmationContent = {
  heading: string;
  body: string;
  referenceLabel: string;
  stampText: string;
  closeLabel: string;
};

const STAMP_IMPACT_ROTATION_DEGREES = -12;

export function BookingConfirmation({
  reference,
  content,
  onClose,
}: {
  reference: string;
  content: BookingConfirmationContent;
  onClose: () => void;
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
      {/* Decorative-only: distorts the worn outer ring (see .stamp_ring::after)
          so it reads as ink rather than a vector circle. Never applied to
          text, which stays crisp for legibility. */}
      <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden="true">
        <filter id="stamp-grain">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="7" result="noise" />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="6" />
        </filter>
      </svg>
      <div className={styles.booking_confirmation_container}>
        {/* The ring is the stamp: it is what the timeline slams down, so the
            animation hooks sit on it and on the text that follows it in. */}
        <div className={styles.stamp_ring} data-stamp>
          <p className={styles.stamp_word}>{content.stampText}</p>
          <p className={styles.stamp_reference}>
            {content.referenceLabel}
            {reference}
          </p>
        </div>
        <div data-confirmation-body>
          <h5 className={styles.confirmation_heading}>{content.heading}</h5>
          <p className={styles.confirmation_body}>{content.body}</p>
          <button
            type="button"
            className={styles.confirmation_close_button}
            onClick={onClose}
          >
            {content.closeLabel}
          </button>
        </div>
      </div>
    </div>
  );
}