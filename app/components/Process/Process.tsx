import { useEffect, useRef } from "react";
import styles from "./Process.module.css";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useIntlayer } from "react-intlayer";
gsap.registerPlugin(ScrollTrigger);

export default function Process() {
  const { heading, steps: processSteps } = useIntlayer("Process");
  const processContainerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const tracklineRefs = useRef<(HTMLDivElement | null)[]>([]);
  const markerRef = useRef<HTMLDivElement>(null);
  const stepRefs = useRef<(HTMLDivElement | null)[]>([]);
  const stepMarkerRefs = useRef<(HTMLDivElement | null)[]>([]);
  const tracklineFillRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const processContainer = processContainerRef.current;
    const track = trackRef.current;
    const marker = markerRef.current;
    const [trackline1, trackline2] = tracklineRefs.current;
    const steps = stepRefs.current.filter(
      (step): step is HTMLDivElement => step !== null,
    );
    const stepMarkers = stepMarkerRefs.current.filter(
      (stepMarker): stepMarker is HTMLDivElement => stepMarker !== null,
    );
    const tracklineFills = tracklineFillRefs.current.filter(
      (fill): fill is HTMLDivElement => fill !== null,
    );

    if (
      !processContainer ||
      !track ||
      !marker ||
      !trackline1 ||
      !trackline2 ||
      steps.length === 0
    ) {
      return;
    }

    const mobileQuery = window.matchMedia("(max-width: 768px)");

    const ctx = gsap.context(() => {
      let scrollTriggerInstance: ScrollTrigger | undefined;

      const build = () => {
        const isVertical = mobileQuery.matches;

        const trackRect = track.getBoundingClientRect();
        const line1Rect = trackline1.getBoundingClientRect();
        const line2Rect = trackline2.getBoundingClientRect();

        const markerSize = marker.offsetWidth;
        const trackLength = isVertical ? trackRect.height : trackRect.width;
        const crossAxisCenter = isVertical
          ? (line1Rect.right + line2Rect.left) / 2 - trackRect.left
          : (line1Rect.bottom + line2Rect.top) / 2 - trackRect.top;

        if (isVertical) {
          gsap.set(marker, {
            top: 0,
            left: crossAxisCenter - markerSize / 2,
            x: 0,
            y: -markerSize / 2,
            ease: "power3.out",
          });
        } else {
          gsap.set(marker, {
            top: crossAxisCenter - markerSize / 2,
            left: 0,
            x: -markerSize / 2,
            y: 0,
            ease: "power3.out",
            snap: {
              x: 0.15,
            },
          });
        }

        gsap.set(
          tracklineFills,
          isVertical ? { scaleX: 1, scaleY: 0 } : { scaleX: 0, scaleY: 1 },
        );

        gsap.set(stepMarkers, {
          xPercent: -50,
          yPercent: -50,
          scale: 1,
          x: 0,
          y: 0,
          top: isVertical ? 0 : crossAxisCenter,
          left: isVertical ? crossAxisCenter : 0,
        });

        const timeline = gsap.timeline({
          scrollTrigger: {
            trigger: processContainer,
            start: isVertical ? "top 2%" : "top 10%",
            end: "+=100%",
            scrub: 1,
            pin: true,
            anticipatePin: 1,
          },
        });

        timeline.to(
          marker,
          isVertical
            ? { y: trackLength - markerSize / 2, ease: "none", duration: 1 }
            : { x: trackLength - markerSize / 2, ease: "none", duration: 1 },
          0,
        );

        timeline.to(
          tracklineFills,
          isVertical
            ? { scaleY: 1, ease: "none", duration: 1 }
            : { scaleX: 1, ease: "none", duration: 1 },
          0,
        );

        steps.forEach((step, index) => {
          const stepMarker = stepMarkers[index];
          const stepRect = step.getBoundingClientRect();
          const stepStart = isVertical
            ? stepRect.top - trackRect.top
            : stepRect.left - trackRect.left;
          const stepSize = isVertical ? stepRect.height : stepRect.width;
          const stepCenter = stepStart + stepSize / 2;
          const progress = gsap.utils.clamp(0, 1, stepCenter / trackLength);

          if (stepMarker) {
            gsap.set(
              stepMarker,
              isVertical ? { y: stepCenter } : { x: stepCenter },
            );
          }

          timeline.to(
            step,
            { opacity: 1,
              duration: 0.2,
              ease: "power3.in" },
            Math.max(0, progress - 0.03),
          );

          if (stepMarker) {
            timeline.to(
              stepMarker,
              {
                scale: 1.25,
                backgroundColor: "var(--color-secondary)",
                duration: 0.15,
                ease: "power3.in",
              },
              Math.max(0, progress - 0.09),
            );
          }
        });

        scrollTriggerInstance = timeline.scrollTrigger;
      };

      build();

      const handleResize = () => {
        scrollTriggerInstance?.kill();
        gsap.set(steps, { clearProps: "opacity" });
        build();
        ScrollTrigger.refresh();
      };

      window.addEventListener("resize", handleResize);

      return () => {
        window.removeEventListener("resize", handleResize);
      };
    }, processContainer);

    return () => ctx.revert();
  }, []);

  return (
    <section className={styles.section_process}>
      <div className={styles.process_container} ref={processContainerRef}>
        <h2 className={styles.section_heading}>{heading}</h2>
        <div className={styles.process_wrapper}>
        <div className={styles.process_track} ref={trackRef}>
          <div
            className={styles.process_trackline}
            ref={(el) => {
              tracklineRefs.current[0] = el;
            }}
          >
            <div
              className={styles.process_trackline_fill}
              ref={(el) => {
                tracklineFillRefs.current[0] = el;
              }}
            ></div>
          </div>
          <div
            className={styles.process_trackline}
            ref={(el) => {
              tracklineRefs.current[1] = el;
            }}
          >
            <div
              className={styles.process_trackline_fill}
              ref={(el) => {
                tracklineFillRefs.current[1] = el;
              }}
            ></div>
          </div>
          <div className={styles.process_marker} ref={markerRef}></div>
          {processSteps.map((step, index) => (
            <div
              className={styles.process_step_marker}
              key={String(step.number)}
              ref={(el) => {
                stepMarkerRefs.current[index] = el;
              }}
            >
              <h6>{step.number}</h6>
            </div>
          ))}
        </div>
        <div className={styles.process_steps}>
          {processSteps.map((step, index) => (
            <div
              className={styles.process_step}
              key={String(step.number)}
              ref={(el) => {
                stepRefs.current[index] = el;
              }}
            >
              <h4 className={styles.process_step_title}>{step.title}</h4>
              <p>{step.text}</p>
            </div>
          ))}
        </div>
        </div>
      </div>
    </section>
  );
}