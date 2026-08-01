import type { FC } from "react";

import { getLocalizedUrl, type LocalesValues } from "intlayer";
import { useLocale } from "react-intlayer";
import { Link, NavLink, type LinkProps, type NavLinkProps, type To } from "react-router";

const isExternalLink = (to: string) => /^(https?:)?\/\//.test(to);

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
    />
  );
};