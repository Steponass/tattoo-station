import { useEffect, useRef } from "react";
import styles from "./Process.module.css";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useIntlayer } from "react-intlayer";
gsap.registerPlugin(ScrollTrigger);
ScrollTrigger.config({ ignoreMobileResize: true });

const RECEDE_Y = 8;
const RECEDE_SCALE = 0.05;
const RECEDE_BRIGHTNESS = 0.35;

export default function Process() {
  const { heading, steps: processSteps } = useIntlayer("Process");
  const processContainerRef = useRef<HTMLDivElement>(null);
  const stackRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const processContainer = processContainerRef.current;
    const stack = stackRef.current;
    const cards = cardRefs.current.filter(
      (card): card is HTMLDivElement => card !== null,
    );

    if (!processContainer || !stack || cards.length === 0) {
      return;
    }

    const ctx = gsap.context(() => {
      let scrollTriggerInstance: ScrollTrigger | undefined;

      const build = () => {
        const enterDistance = Math.max(window.innerHeight * 0.8, 600);

        gsap.set(cards, {
          y: enterDistance,
          scale: 0.9,
          filter: "brightness(1)",
        });

        const timeline = gsap.timeline({
          scrollTrigger: {
            trigger: processContainer,
            start: "20% 20%",
            end: `+=${cards.length * 100}%`,
            scrub: 1,
            pin: true,
            anticipatePin: 1,
          },
        });

        cards.forEach((card, index) => {
          timeline.to(
            card,
            { 
              y: 0, 
              scale: 1, 
              filter: "brightness(1)", 
              ease: "power2.out", 
              duration: 1 },
            index,
          );

          for (let behind = 0; behind < index; behind += 1) {
            const depth = index - behind;
            timeline.to(
              cards[behind],
              {
                y: -depth * RECEDE_Y,
                scale: 1 - depth * RECEDE_SCALE,
                filter: `brightness(${1 - depth * RECEDE_BRIGHTNESS})`,
                ease: "power2.out",
                duration: 1,
                rotationY: 5
              },
              index,
            );
          }
        });

        scrollTriggerInstance = timeline.scrollTrigger;
      };

      build();

      let lastWidth = window.innerWidth;

      const handleResize = () => {
        if (window.innerWidth === lastWidth) {
          return;
        }
        lastWidth = window.innerWidth;

        scrollTriggerInstance?.kill();
        gsap.set(cards, { clearProps: "all" });
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
        <div className={styles.card_stack} ref={stackRef}>
          {processSteps.map((step, index) => (
            <div
              className={`${styles.card} chamfer chamfer-xl punch punch-xl`}
              key={String(step.number)}
              ref={(el) => {
                cardRefs.current[index] = el;
              }}
              style={{ zIndex: index + 1 }}
            >
              <h3 className={styles.card_number}>{step.number}</h3>
              <h4 className={styles.card_title}>{step.title}</h4>
              <p>{step.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
