import { useEffect, useState } from "react";
import { LocalizedLink, LocalizedNavLink } from "~/components/intlayer/LocalizedLink";
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
          <LocalizedLink to="/">
            <img src="/TEMP-Logo-from-photo.webp" />
          </LocalizedLink>
        </div>
        <nav className={styles.nav}>
          <LocalizedNavLink to="/artists">
            {artists}
          </LocalizedNavLink>
          <LocalizedNavLink to="/piercing">
            {piercing}
          </LocalizedNavLink>
          <LocalizedNavLink to="/flashdesigns">
            {flashdesigns}
          </LocalizedNavLink>
          <LocalizedNavLink to="/tattoostyles">
            {tattoostyles}
          </LocalizedNavLink>
          <LocalizedNavLink to="/aftercare">
            {aftercare}
          </LocalizedNavLink>
          <LocalizedNavLink to="/faq">
            {faq}
          </LocalizedNavLink>
          <LocalizedNavLink to="/coupon">
            {coupon}
          </LocalizedNavLink>
          <LocalizedNavLink to="/booking">
            {booking}
          </LocalizedNavLink>
        </nav>
        <LocaleSwitcher />
      </header>
      
      <header
        className={`${styles.header_mobile} ${isMenuOpen ? styles.open : ""}`}
      >
        <div className={styles.logo}>
          <LocalizedLink to="/">
            <img src="/public/TEMP-Logo-from-photo.webp" />
          </LocalizedLink>
        </div>

        <nav
          id="mobile-nav"
          className={styles.mobile_nav}
          aria-hidden={!isMenuOpen}
        >
          <LocalizedNavLink to="/artists" onClick={closeMenu}>
            {artists}
          </LocalizedNavLink>
          <LocalizedNavLink to="/piercing" onClick={closeMenu}>
            {piercing}
          </LocalizedNavLink>
          <LocalizedNavLink to="/faq" onClick={closeMenu}>
            {faq}
          </LocalizedNavLink>
          <LocalizedNavLink to="/tattoostyles" onClick={closeMenu}>
            {tattoostyles}
          </LocalizedNavLink>
          <LocalizedNavLink to="/aftercare" onClick={closeMenu}>
            {aftercare}
          </LocalizedNavLink>
          <LocalizedNavLink to="/flashdesigns" onClick={closeMenu}>
            {flashdesigns}
          </LocalizedNavLink>
          <LocalizedNavLink to="/coupon" onClick={closeMenu}>
            {coupon}
          </LocalizedNavLink>
          <LocalizedNavLink to="/booking" onClick={closeMenu}>
            {booking}
          </LocalizedNavLink>
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
              {/* <rect x="0" y="0" width="66" height="20" /> */}
              <rect x="20" y="-10" width="76" height="22" />
              <rect x="50" y="30" width="76" height="22" />
            </svg>
          </button>
        </div>
      </header>
    </>
  );
}
