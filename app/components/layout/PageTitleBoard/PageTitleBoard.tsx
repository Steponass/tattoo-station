import { useMatches } from "react-router";
import { useIntlayer } from "react-intlayer";
import {
  SplitFlapText,
  type SplitFlapTimingOverrides,
} from "~/components/splitflap/SplitFlapText";
import pageTitleBoardContent from "./PageTitleBoard.content";
import styles from "./PageTitleBoard.module.css";

type PageTitleBoardLabelKey = keyof typeof pageTitleBoardContent.content;

interface TitleBoardHandle {
  show?: boolean;
  labelKey?: PageTitleBoardLabelKey;
  label?: string;
  timing?: SplitFlapTimingOverrides;
}

interface RouteHandle {
  titleBoard?: TitleBoardHandle;
}

interface BoardLabel {
  shouldShow: boolean;
  label: string;
  timing?: SplitFlapTimingOverrides;
}

const NO_LABEL: BoardLabel = { shouldShow: false, label: "" };

/*
 * Resolves what the page-title board should display for the
 * currently active route
 *
 * Reads `handle.titleBoard` off the deepest matching route. A route
 * can either name a static `labelKey` (resolved through Intlayer, so
 * it renders per-locale) or supply an already-resolved `label`
 * directly (for dynamic, non-Intlayer content such as artist names)
 */
const useBoardLabel = (): BoardLabel => {
  const matches = useMatches();
  const content = useIntlayer("page-title-board");

  const deepestMatchWithHandle = [...matches]
    .reverse()
    .find((match) => (match.handle as RouteHandle | undefined)?.titleBoard);

  const titleBoard = (deepestMatchWithHandle?.handle as RouteHandle | undefined)
    ?.titleBoard;

  if (!titleBoard?.show) {
    return NO_LABEL;
  }

  if (titleBoard.label) {
    return {
      shouldShow: true,
      label: titleBoard.label,
      timing: titleBoard.timing,
    };
  }

  if (titleBoard.labelKey) {
    const resolvedLabel = content[titleBoard.labelKey];
    return {
      shouldShow: true,
      label: String(resolvedLabel),
      timing: titleBoard.timing,
    };
  }

  return NO_LABEL;
};

/*
 * Page-title band, rendered once in the app shell above `<Outlet/>`.
 * This is the page's real <h1>.
 *
 * `PageTitleBoard` itself never unmounts; only the `<h1>`/
 * `SplitFlapText` subtree toggles as `shouldShow` changes. So
 * `SplitFlapText` mounts fresh every time the band becomes visible
 * and flips in — a hard refresh and a home → piercing navigation
 * look the same.
 */
export function PageTitleBoard() {
  const { shouldShow, label, timing } = useBoardLabel();

  if (!shouldShow) {
    return null;
  }

  return (
    <h1 className={styles.splitflap_heading}>
      <SplitFlapText target={label} timing={timing} />
    </h1>
  );
}
