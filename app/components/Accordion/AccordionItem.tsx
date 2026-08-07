import { useRef, type MouseEvent, type ReactNode } from "react";
import { useAccordionAnimation } from "./useAccordionAnimation";
import styles from "./Accordion.module.css";

type AccordionItemProps = {
  question: string;
  answer: ReactNode;
};

export default function AccordionItem({
  question,
  answer,
}: AccordionItemProps) {
  const detailsRef = useRef<HTMLDetailsElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const toggleAccordion = useAccordionAnimation({
    detailsRef,
    panelRef: contentRef,
  });

  function handleSummaryClick(event: MouseEvent<HTMLElement>) {
    // Suppress the native toggle so the WAAPI animation owns the open state.
    event.preventDefault();
    toggleAccordion();
  }

  return (
    <details className={styles.accordion_item} ref={detailsRef}>
      <summary
        className={styles.accordion_summary}
        onClick={handleSummaryClick}
      >
        <span className={styles.accordion_marker} aria-hidden="true" />
        <p>{question}</p>
      </summary>
      <div className={styles.accordion_answer_wrapper} ref={contentRef}>
        <div className={styles.accordion_answer}><p>{answer}</p></div>
      </div>
    </details>
  );
}
