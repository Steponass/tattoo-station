import type { FC, MouseEvent } from "react";

import { getLocalizedUrl, type LocalesValues } from "intlayer";
import { useLocale } from "react-intlayer";
import { Link, NavLink, type LinkProps, type NavLinkProps, type To } from "react-router";

const isExternalLink = (to: string) => /^(https?:)?\/\//.test(to);

// Guards mirror the conditions under which React Router itself would perform an
// in-app, view-transitioned navigation (plain left click, no modifier keys, same
// tab, no full reload). If the page is scrolled, snap to top *before* returning
// control to React Router's click handler, so the transition's old/new snapshots
// are both captured already at rest. Otherwise React Router's own <ScrollRestoration />
// reset races the page-wipe transition, because its scrollTo(0, 0) inherits the
// global `scroll-behavior: smooth` (css-reset.css) and animates concurrently with
// the slide instead of snapping instantly beforehand.
export const scrollToTopBeforeTransition = (
  event: MouseEvent<HTMLAnchorElement>,
  { viewTransition, target, reloadDocument, onClick }: Pick<
    LinkProps,
    "viewTransition" | "target" | "reloadDocument" | "onClick"
  >,
) => {
  onClick?.(event);
  if (
    event.defaultPrevented ||
    !viewTransition ||
    reloadDocument ||
    (target && target !== "_self") ||
    event.button !== 0 ||
    event.metaKey || event.ctrlKey || event.shiftKey || event.altKey
  ) {
    return;
  }

  if (window.scrollY > 0) window.scrollTo({ top: 0, left: 0, behavior: "instant" });
};

export const locacalizeTo = (to: To, locale: LocalesValues): To => {
  if (typeof to === "string") {
    if (isExternalLink(to)) {
      return to;
    }

    return getLocalizedUrl(to, locale);
  }

  if (isExternalLink(to.pathname ?? "")) {
    return to;
  }

  return {
    ...to,
    pathname: getLocalizedUrl(to.pathname ?? "", locale),
  };
};

// `viewTransition` defaults to true so every in-app link gets the root wipe
// from app/styles/page-transitions.css. It has to be forwarded to <Link> —
// React Router only calls startViewTransition when the prop reaches it.
export const LocalizedLink: FC<LinkProps> = ({ viewTransition = true, ...props }) => {
  const { locale } = useLocale();

  return (
    <Link
      {...props}
      to={locacalizeTo(props.to, locale)}
      viewTransition={viewTransition}
      onClick={(event) => scrollToTopBeforeTransition(event, { ...props, viewTransition })}
    />
  );
};

// Same as LocalizedLink, but renders <NavLink> so the link matching the current
// URL gets aria-current="page" (and React Router's active/pending class state).
export const LocalizedNavLink: FC<NavLinkProps> = ({ viewTransition = true, ...props }) => {
  const { locale } = useLocale();

  return (
    <NavLink
      {...props}
      to={locacalizeTo(props.to, locale)}
      viewTransition={viewTransition}
      onClick={(event) => scrollToTopBeforeTransition(event, { ...props, viewTransition })}
    />
  );
};