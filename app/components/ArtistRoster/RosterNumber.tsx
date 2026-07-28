import { splitRosterPositionDigits } from "~/data/roster.format";
import styles from "./Roster.module.css";

interface RosterNumberProps {
  position: string;
}

export function RosterNumber({ position }: RosterNumberProps) {
  const digits = splitRosterPositionDigits(position);

  return (
    <p className={styles.roster_number} aria-hidden="true">
      {digits.map((digit, digitIndex) => (
        <span key={`${position}-${digitIndex}`}>{digit}</span>
      ))}
    </p>
  );
}