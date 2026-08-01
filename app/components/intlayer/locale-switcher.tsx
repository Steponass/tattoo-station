import type { FC } from "react";
import styles from './locale-switcher.module.css'

import {
  getLocaleName,
  getLocalizedUrl,
  getPathWithoutLocale,
} from "intlayer";
import { setLocaleInStorage, useIntlayer, useLocale } from "react-intlayer";
import { Link, useLocation } from "react-router";

export const LocaleSwitcher: FC = () => {
  const { localeSwitcherLabel } = useIntlayer("locale-switcher");
  const { pathname } = useLocation();

  const { availableLocales, locale } = useLocale();

  const pathWithoutLocale = getPathWithoutLocale(pathname);

  return (
    <ol className={styles.locale_switcher}>
      {availableLocales.map((localeItem) => (
        <li key={localeItem} className="chamfer chamfer-xs">
          <Link
            aria-current={localeItem === locale ? "page" : undefined}
            aria-label={`${localeSwitcherLabel.value} ${getLocaleName(localeItem)}`}
            onClick={() => setLocaleInStorage(localeItem, true)}
            to={getLocalizedUrl(pathWithoutLocale, localeItem)}
            viewTransition
          >
            <span>
              {localeItem}
            </span>

          </Link>
        </li>
      ))}
    </ol>
  );
};