import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import styles from "./SplitFlapText.module.css";

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


interface SplitFlapTiming {
  flapDurationSeconds: number;
  characterStaggerSeconds: number;
  minimumFlapCount: number;
}

export type SplitFlapTimingOverrides = Partial<SplitFlapTiming>;

const DEFAULT_TIMING: SplitFlapTiming = {
  flapDurationSeconds: 0.04,
  characterStaggerSeconds: 0.3,
  minimumFlapCount: 25,
};


const BASELINE_WORD_LENGTH = 7;

const getSplitFlapTiming = (
  longestWordLength: number,
  overrides: SplitFlapTimingOverrides = {},
): SplitFlapTiming => {
  const timing = { ...DEFAULT_TIMING, ...overrides };

  return {
    ...timing,
    minimumFlapCount:
      timing.minimumFlapCount +
      Math.max(0, longestWordLength - BASELINE_WORD_LENGTH),
  };
};

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
  /** Per-page cadence overrides; omitted fields keep the tuned defaults. */
  timing?: SplitFlapTimingOverrides;
  onSettled?: () => void;
}


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
      <span className={styles.right_hinge} />
      <span className={styles.left_hinge} />
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


export function SplitFlapText({
  target,
  timing: timingOverrides,
  onSettled,
}: SplitFlapTextProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const wordDescriptors = buildWordDescriptors(target);
  const timing = getSplitFlapTiming(
    getLongestWordLength(target),
    timingOverrides,
  );

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
    {
      scope: containerRef,
      dependencies: [
        target,
        timing.flapDurationSeconds,
        timing.characterStaggerSeconds,
        timing.minimumFlapCount,
      ],
      revertOnUpdate: true,
    },
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
