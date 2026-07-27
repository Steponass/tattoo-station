import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import styles from "./SplitFlapText.module.css";

/* ============================================================
 * The character drum
 * ============================================================ */

/**
 * The character drum, in physical order, exactly like the printed
 * flaps on a real Solari board. Every cell steps through this
 * order — it never jumps to arbitrary characters.
 *
 * Lithuanian diacritics are appended after Z and before the digits,
 * rather than interleaved next to their base letter (Č after C, etc.),
 * to keep the drum a simple, linearly-indexed extension of the
 * authentic space/A–Z/0–9 order.
 */
const FLAP_DRUM = " ABCDEFGHIJKLMNOPQRSTUVWXYZĖČŠŽŲŪĄĮ0123456789";
const BLANK_CHARACTER = " ";

interface FlapStep {
  fromCharacter: string;
  toCharacter: string;
}

const getDrumIndex = (character: string): number => {
  const drumIndex = FLAP_DRUM.indexOf(character.toUpperCase());
  return drumIndex === -1 ? 0 : drumIndex;
};

/**
 * Builds the ordered list of flips a cell performs to land on its
 * target character. Each step knows what it flips FROM and TO, so
 * the animation is fully deterministic — restarting the timeline
 * replays the exact same sequence.
 */
const buildFlapSequence = (
  targetCharacter: string,
  flapCount: number,
): FlapStep[] => {
  const targetDrumIndex = getDrumIndex(targetCharacter);
  const drumLength = FLAP_DRUM.length;

  const drumCharacters = Array.from({ length: flapCount }, (_, stepIndex) => {
    const drumIndex =
      (targetDrumIndex - flapCount + 1 + stepIndex + drumLength * 2) %
      drumLength;
    return FLAP_DRUM[drumIndex];
  });

  return drumCharacters.map((toCharacter, stepIndex) => ({
    fromCharacter:
      stepIndex === 0 ? BLANK_CHARACTER : drumCharacters[stepIndex - 1],
    toCharacter,
  }));
};

/* ============================================================
 * Timing budget
 * ============================================================ */

interface SplitFlapTiming {
  flapDurationSeconds: number;
  characterStaggerSeconds: number;
  minimumFlapCount: number;
}

const FLAP_DURATION_SECONDS = 0.04;
const CHARACTER_STAGGER_SECONDS = 0.3;
const MINIMUM_FLAP_COUNT = 25;

/**
 * Timing budget (per word), worst case at the last character (index = i):
 *   finish(i) = i * characterStaggerSeconds
 *             + (minimumFlapCount + i) * flapDurationSeconds
 *
 * Longer target strings (e.g. Lithuanian "TATUIRUOTĖS" vs. English
 * "ARTISTS") need more characters to settle, so the flap count grows
 * with the longest word rather than staying fixed — this keeps the
 * per-character cadence constant while the overall settle time scales
 * with how much text is actually on the board.
 */
const getSplitFlapTiming = (longestWordLength: number): SplitFlapTiming => ({
  flapDurationSeconds: FLAP_DURATION_SECONDS,
  characterStaggerSeconds: CHARACTER_STAGGER_SECONDS,
  minimumFlapCount: MINIMUM_FLAP_COUNT + Math.max(0, longestWordLength - 7),
});

/* ============================================================
 * Types
 * ============================================================ */

interface CellDescriptor {
  cellKey: string;
  targetCharacter: string;
  characterIndexInWord: number;
}

interface WordDescriptor {
  wordKey: string;
  cells: CellDescriptor[];
}

interface CellParts {
  topStaticGlyph: HTMLElement;
  bottomStaticGlyph: HTMLElement;
  frontGlyph: HTMLElement;
  backGlyph: HTMLElement;
  rotor: HTMLElement;
  frontFace: HTMLElement;
  backFace: HTMLElement;
}

export interface SplitFlapTextProps {
  target: string;
  onSettled?: () => void;
}

/* ============================================================
 * Business logic — pure, testable, no DOM, no React.
 * ============================================================ */

/**
 * "TATTOO STATION" → word/cell descriptors. Spaces become gaps
 * between word groups, not cells.
 */
const buildWordDescriptors = (text: string): WordDescriptor[] =>
  text
    .toUpperCase()
    .split(" ")
    .filter((word) => word.length > 0)
    .map((word, wordIndex) => ({
      wordKey: `${word}-${wordIndex}`,
      cells: Array.from(word, (targetCharacter, characterIndexInWord) => ({
        cellKey: `${wordIndex}-${characterIndexInWord}`,
        targetCharacter,
        characterIndexInWord,
      })),
    }));

const getLongestWordLength = (text: string): number =>
  text
    .split(" ")
    .filter((word) => word.length > 0)
    .reduce((longest, word) => Math.max(longest, word.length), 0);

/* ============================================================
 * GSAP orchestration — imperative on purpose.
 *
 * Hundreds of character flips at 80ms cadence would mean hundreds
 * of React state updates in under a second. Instead, one GSAP
 * timeline mutates textContent + rotationX directly.
 *
 * All GSAP hooks are data attributes, so CSS-module class name
 * hashing never touches the animation layer.
 * ============================================================ */

const queryCellParts = (cellElement: HTMLElement): CellParts | null => {
  const topStaticGlyph = cellElement.querySelector<HTMLElement>(
    "[data-flap-top-static]",
  );
  const bottomStaticGlyph = cellElement.querySelector<HTMLElement>(
    "[data-flap-bottom-static]",
  );
  const frontFace = cellElement.querySelector<HTMLElement>(
    "[data-flap-face-front]",
  );
  const backFace = cellElement.querySelector<HTMLElement>(
    "[data-flap-face-back]",
  );
  const frontGlyph =
    cellElement.querySelector<HTMLElement>("[data-flap-front]");
  const backGlyph = cellElement.querySelector<HTMLElement>("[data-flap-back]");
  const rotor = cellElement.querySelector<HTMLElement>("[data-flap-rotor]");

  if (
    !topStaticGlyph ||
    !bottomStaticGlyph ||
    !frontGlyph ||
    !backGlyph ||
    !rotor ||
    !frontFace ||
    !backFace
  ) {
    return null;
  }

  return {
    topStaticGlyph,
    bottomStaticGlyph,
    frontGlyph,
    backGlyph,
    rotor,
    frontFace,
    backFace,
  };
};

const resetCellToBlank = (cellParts: CellParts): void => {
  const {
    topStaticGlyph,
    bottomStaticGlyph,
    frontGlyph,
    backGlyph,
    rotor,
    frontFace,
    backFace,
  } = cellParts;

  topStaticGlyph.textContent = BLANK_CHARACTER;
  bottomStaticGlyph.textContent = BLANK_CHARACTER;
  frontGlyph.textContent = BLANK_CHARACTER;
  backGlyph.textContent = BLANK_CHARACTER;

  gsap.set(rotor, { rotationX: 0 });
  gsap.set(frontFace, { autoAlpha: 1 });
  gsap.set(backFace, { autoAlpha: 0 });
};

const setCellToFinalState = (cellElement: HTMLElement): void => {
  const cellParts = queryCellParts(cellElement);
  const targetCharacter = cellElement.dataset.targetCharacter ?? BLANK_CHARACTER;

  if (!cellParts) {
    return;
  }

  const {
    topStaticGlyph,
    bottomStaticGlyph,
    frontGlyph,
    backGlyph,
    rotor,
    frontFace,
    backFace,
  } = cellParts;

  // The rotor's front face sits flush over the top-static glyph at
  // rotationX 0, so it must be painted with the target character too —
  // otherwise its blank initial render masks the top half of the letter.
  topStaticGlyph.textContent = targetCharacter;
  bottomStaticGlyph.textContent = targetCharacter;
  frontGlyph.textContent = targetCharacter;
  backGlyph.textContent = targetCharacter;

  gsap.set(rotor, { rotationX: 0 });
  gsap.set(frontFace, { autoAlpha: 1 });
  gsap.set(backFace, { autoAlpha: 0 });
};

const buildCellTimeline = (
  cellElement: HTMLElement,
  timing: SplitFlapTiming,
): gsap.core.Timeline | null => {
  const cellParts = queryCellParts(cellElement);
  const targetCharacter = cellElement.dataset.targetCharacter ?? BLANK_CHARACTER;
  const characterIndexInWord = Number(cellElement.dataset.characterIndex);

  if (!cellParts) {
    return null;
  }

  const flapCount = timing.minimumFlapCount + characterIndexInWord;
  const flapSequence = buildFlapSequence(targetCharacter, flapCount);

  const cellTimeline = gsap.timeline();
  cellTimeline.call(() => resetCellToBlank(cellParts));

  flapSequence.forEach(({ fromCharacter, toCharacter }) => {
    const halfFlapDuration = timing.flapDurationSeconds / 2;

    cellTimeline.to(cellParts.rotor, {
      rotationX: -90,
      duration: halfFlapDuration,
      ease: "power1.in",
      onStart: () => {
        cellParts.topStaticGlyph.textContent = toCharacter;
        cellParts.frontGlyph.textContent = fromCharacter;
        cellParts.backGlyph.textContent = toCharacter;
      },
    });

    // At -90° the flap is edge-on: swap which face is painted.
    cellTimeline.set(cellParts.frontFace, { autoAlpha: 0 });
    cellTimeline.set(cellParts.backFace, { autoAlpha: 1 });

    cellTimeline.to(cellParts.rotor, {
      rotationX: -180,
      duration: halfFlapDuration,
      ease: "power3.out",
      onComplete: () => {
        cellParts.bottomStaticGlyph.textContent = toCharacter;
        cellParts.frontGlyph.textContent = toCharacter;
        gsap.set(cellParts.rotor, { rotationX: 0 });
        gsap.set(cellParts.frontFace, { autoAlpha: 1 });
        gsap.set(cellParts.backFace, { autoAlpha: 0 });
      },
    });
  });

  return cellTimeline;
};

/**
 * Flips every cell from blank to `target`, staggered by the
 * character's index within its word.
 */
const playFlipToTarget = (
  scopeElement: HTMLElement,
  timing: SplitFlapTiming,
  onSettled?: () => void,
): gsap.core.Timeline => {
  const cellElements = gsap.utils.toArray<HTMLElement>(
    "[data-flap-cell]",
    scopeElement,
  );

  const masterTimeline = gsap.timeline({
    onComplete: onSettled,
  });

  cellElements.forEach((cellElement) => {
    const characterIndexInWord = Number(cellElement.dataset.characterIndex);
    const cellTimeline = buildCellTimeline(cellElement, timing);

    if (!cellTimeline) {
      return;
    }

    masterTimeline.add(
      cellTimeline,
      characterIndexInWord * timing.characterStaggerSeconds,
    );
  });

  return masterTimeline;
};

/* ============================================================
 * UI components
 * ============================================================ */

/**
 * One flap cell's DOM skeleton. Every glyph renders blank — the
 * target letter travels in `data-target-character` and is painted
 * imperatively by GSAP, so this markup is identical on the server
 * and on first client render (no hydration mismatch).
 *
 * The `data-flap-*` attributes are the animation layer's only
 * contract with this markup; `queryCellParts` selects on them.
 */
function SplitFlapCell({ cell }: { cell: CellDescriptor }) {
  const { targetCharacter, characterIndexInWord } = cell;

  return (
    <span
      className={styles.cell}
      data-flap-cell
      data-target-character={targetCharacter}
      data-character-index={characterIndexInWord}
    >
      <span className={`${styles.half} ${styles.halfTop}`}>
        <span className={styles.glyph} data-flap-top-static>
          {BLANK_CHARACTER}
        </span>
      </span>

      <span className={`${styles.half} ${styles.halfBottom}`}>
        <span className={styles.glyph} data-flap-bottom-static>
          {BLANK_CHARACTER}
        </span>
      </span>

      <span className={styles.rotor} data-flap-rotor>
        <span className={`${styles.face} ${styles.faceFront}`} data-flap-face-front>
          <span className={styles.glyph} data-flap-front>
            {BLANK_CHARACTER}
          </span>
        </span>
        <span className={`${styles.face} ${styles.faceBack}`} data-flap-face-back>
          <span className={styles.glyph} data-flap-back>
            {BLANK_CHARACTER}
          </span>
        </span>
      </span>

      <span className={styles.hinge} />
    </span>
  );
}

function SplitFlapWord({ word }: { word: WordDescriptor }) {
  const { cells } = word;

  return (
    <span className={styles.word}>
      {cells.map((cell) => (
        <SplitFlapCell key={cell.cellKey} cell={cell} />
      ))}
    </span>
  );
}

/**
 * Presentational split-flap primitive: renders `target` and flips to
 * it on every mount and on every `target` change. Holds no
 * router/i18n knowledge — the caller decides what string to show and
 * when it changes.
 *
 * The board is markup-blank until GSAP paints it, so a hard refresh
 * and a client-side navigation look the same: cells arrive empty and
 * flip in. The real string is always exposed to assistive tech and to
 * the raw SSR HTML through the visually-hidden label, independent of
 * animation state — which is why the board itself is `aria-hidden`
 * (otherwise each cell would be announced as a loose character).
 *
 * Under `prefers-reduced-motion: reduce` the cells snap straight to
 * their final state with no flip.
 */
export function SplitFlapText({ target, onSettled }: SplitFlapTextProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const wordDescriptors = buildWordDescriptors(target);
  const timing = getSplitFlapTiming(getLongestWordLength(target));

  useGSAP(
    () => {
      const scopeElement = containerRef.current;
      if (!scopeElement) {
        return;
      }

      const matchMedia = gsap.matchMedia();

      matchMedia.add("(prefers-reduced-motion: reduce)", () => {
        gsap.utils
          .toArray<HTMLElement>("[data-flap-cell]", scopeElement)
          .forEach(setCellToFinalState);
        onSettled?.();
      });

      matchMedia.add("(prefers-reduced-motion: no-preference)", () => {
        playFlipToTarget(scopeElement, timing, onSettled);
      });
    },
    // `revertOnUpdate` kills the in-flight timeline before a new
    // `target` starts its own: without it @gsap/react defers cleanup
    // to unmount, and two timelines would write textContent into the
    // same cells at once (e.g. a locale switch mid-flip).
    { scope: containerRef, dependencies: [target], revertOnUpdate: true },
  );

  return (
    <div className={styles.display} ref={containerRef}>
      <span className={styles.accessibleLabel}>{target}</span>
      <div className={styles.board} aria-hidden="true">
        {wordDescriptors.map((word) => (
          <SplitFlapWord key={word.wordKey} word={word} />
        ))}
      </div>
    </div>
  );
}
