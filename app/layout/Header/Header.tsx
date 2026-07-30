import { useEffect, useState } from "react";
import { LocalizedLink } from "~/components/intlayer/LocalizedLink";
import { LocaleSwitcher } from "~/components/intlayer/locale-switcher";
import styles from "./Header.module.css";

import { useIntlayer } from "react-intlayer";

export default function Header() {
  const {
    booking,
    artists,
    piercing,
    flashdesigns,
    tattoostyles,
    aftercare,
    faq,
    coupon,
  } = useIntlayer("header");

  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    if (!isMenuOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsMenuOpen(false);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isMenuOpen]);

  const closeMenu = () => setIsMenuOpen(false);

  return (
    <>
      <header className={styles.header}>
        <div className={styles.logo}>
          <LocalizedLink to="/" viewTransition>
            <img src="/public/TEMP-Logo-from-photo.webp" />
          </LocalizedLink>
        </div>
        <nav className={styles.nav}>
          <LocalizedLink to="/Artists" viewTransition>
            {artists}
          </LocalizedLink>
          <LocalizedLink to="/piercing" viewTransition>
            {piercing}
          </LocalizedLink>
          <LocalizedLink to="/flashdesigns" viewTransition>
            {flashdesigns}
          </LocalizedLink>
          <LocalizedLink to="/tattoostyles" viewTransition>
            {tattoostyles}
          </LocalizedLink>
          <LocalizedLink to="/aftercare" viewTransition>
            {aftercare}
          </LocalizedLink>
          <LocalizedLink to="/faq" viewTransition>
            {faq}
          </LocalizedLink>
          <LocalizedLink to="/coupon" viewTransition>
            {coupon}
          </LocalizedLink>
          <LocalizedLink to="/booking" viewTransition>
            {booking}
          </LocalizedLink>
        </nav>
        <LocaleSwitcher />
      </header>
      <header
        className={`${styles.header_mobile} ${isMenuOpen ? styles.open : ""}`}
      >
        <div className={styles.logo}>
          <LocalizedLink to="/" viewTransition>
            <img src="/public/TEMP-Logo-from-photo.webp" />
          </LocalizedLink>
        </div>

        <nav
          id="mobile-nav"
          className={styles.mobile_nav}
          aria-hidden={!isMenuOpen}
        >
          <LocalizedLink to="/artists" viewTransition onClick={closeMenu}>
            {artists}
          </LocalizedLink>
          <LocalizedLink to="/piercing" viewTransition onClick={closeMenu}>
            {piercing}
          </LocalizedLink>
          <LocalizedLink to="/faq" viewTransition onClick={closeMenu}>
            {faq}
          </LocalizedLink>
          <LocalizedLink to="/tattoostyles" viewTransition onClick={closeMenu}>
            {tattoostyles}
          </LocalizedLink>
          <LocalizedLink to="/aftercare" viewTransition onClick={closeMenu}>
            {aftercare}
          </LocalizedLink>
          <LocalizedLink to="/flashdesigns" viewTransition onClick={closeMenu}>
            {flashdesigns}
          </LocalizedLink>
          <LocalizedLink to="/coupon" viewTransition onClick={closeMenu}>
            {coupon}
          </LocalizedLink>
          <LocalizedLink to="/booking" viewTransition onClick={closeMenu}>
            {booking}
          </LocalizedLink>
          <LocaleSwitcher />
        </nav>

        <div className={styles.burger_group}>
          <button
            type="button"
            className={styles.burger_wrapper}
            aria-expanded={isMenuOpen}
            aria-controls="mobile-nav"
            aria-label="Toggle menu"
            onClick={() => setIsMenuOpen((open) => !open)}
          >
            <svg
              className={styles.burger_icon}
              viewBox="0 0 132 132"
              fill="currentColor"
              aria-hidden="true"
            >
              <rect x="0" y="0" width="66" height="20" />
              <rect x="33" y="44" width="66" height="20" />
              <rect x="66" y="88" width="66" height="20" />
            </svg>
          </button>
        </div>
      </header>
    </>
  );
}
