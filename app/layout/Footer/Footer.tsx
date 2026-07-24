import styles from "./Footer.module.css";

export default function Footer() {
  return (
    <footer className={styles["footer"]}>
      <div className={styles["footer-container"]}>
        <div className={styles["footer-logo-and-descript"]}>
          <img src="/public/TEMP-Logo-from-photo.webp" />
          <p>
            Lorem ipsum dolor sit amet consectetur adipisicing elit. Hic tenetur
            natus nobis non. Minus rem odit voluptatum sint vel maxime.
          </p>
        </div>
        <div className={styles.footer_info}>
          <a
            href="https://maps.app.goo.gl/kmjisJWycYQpTSkz8"
            target="_blank"
            rel="noopener noreferrer"
          >
            Geležinkelio g. 1, Vilnius
          </a>
          <p>I&#8202;–&#8202;VII | 11:00 – 18:00</p>
        </div>
        <div>
          <a href="tel:+37065068230" target="_blank" rel="noopener noreferrer">
            +370 650 682 30
          </a>
          <a
            href="mailto:info@tattoostation.lt"
            target="_blank"
            rel="noopener noreferrer"
          >
            info@tattoostation.lt
          </a>
        </div>
      </div>
      <div className={styles.footer_policy_container}>
        <div>
          <p>&copy; 2026 Tattoo station</p>
        </div>
        <div>
          <p>FB INSTA TIKTOK [OTHER?]</p>
        </div>
        <div>
          <p>Privatumo politika</p>
        </div>
      </div>
    </footer>
  );
}
