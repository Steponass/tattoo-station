
import { useRef } from "react";
import styles from './BookingForm.module.css'
import { useGSAP } from "@gsap/react";
import gsap from "gsap";

export type BookingConfirmationContent = {
  heading: string;
  body: string;
  referenceLabel: string;
  stampText: string;
};

const STAMP_IMPACT_ROTATION_DEGREES = -8;

export function BookingConfirmation({
  reference,
  content,
}: {
  reference: string;
  content: BookingConfirmationContent;
  className?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);

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
          scale: 1.06,
          duration: 0.08,
          yoyo: true,
          repeat: 1,
          ease: "power2.out",
        })
        .fromTo(
          "[data-confirmation-body]",
          { autoAlpha: 0, y: 8 },
          { autoAlpha: 1, y: 0, duration: 0.4, ease: "power2.out" },
          "-=0.1",
        );
    },
    { scope: containerRef },
  );

  return (
    <div ref={containerRef} className={styles.booking_confirmation_container} data-booking-confirmation>
      <div data-stamp aria-hidden="true">
        {content.stampText}
      </div>

      <div data-confirmation-body>
        <h1 className={styles.heading}>{content.heading}</h1>
        <p>{content.body}</p>
        <p>
          {content.referenceLabel}{"RECEIVED"}
          <strong data-booking-reference>{reference}</strong>
        </p>
      </div>
    </div>
  );
}