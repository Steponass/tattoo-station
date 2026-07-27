import { SplitFlapText } from "~/components/splitflap/SplitFlapText";
import styles from "./SplitFlapIntro.module.css";

export interface SplitFlapIntroProps {
  text?: string;
}

/**
 * Hero wrapper around SplitFlapText: owns the hero layout and the
 * default wordmark. The flap-in itself is SplitFlapText's default
 * behaviour, so this adds no animation logic of its own — and no
 * `aria-label` either, since SplitFlapText already exposes `text` to
 * assistive tech.
 */
export function SplitFlapIntro({ text = "TATTOO STATION" }: SplitFlapIntroProps) {
  return (
    <div className={styles.hero}>
      <SplitFlapText target={text} />
    </div>
  );
}
