
import { getIntlayer, validatePrefix } from "intlayer";
import { useIntlayer } from "react-intlayer";
import { data } from "react-router";
import type { Route } from "./+types/coupon";
import styles from './coupon.module.css'
import NavButton from "~/components/Button/NavButton";

const COUPON_URL = "https://gift.korta.app/tattoo-station";

// Intlayer start
export const loader = ({ params }: Route.LoaderArgs) => {
  const { lang: locale } = params;

  const { isValid } = validatePrefix(locale);

  if (!isValid) {
    throw data("Locale not supported", { status: 404 });
  }
};

export const meta: Route.MetaFunction = ({ params }) => {
  const content = getIntlayer("coupon", params.lang);

  return [
    { title: content.title },
    { content: content.description, name: "description" },
  ];
};
// Intlayer end

// SPLITFLAP BOARD
export const handle = {
  titleBoard: {
    show: true,
    labelKey: "coupon",
    timing: { characterStaggerSeconds: 0.03, minimumFlapCount: 10 },
  },
};

export default function coupon() {
  const { leadText, ticketEyebrow, routeFrom, routeTo, ctaText, ctaNote } = useIntlayer("coupon");

  return (
    <main>
      <section className={styles.coupon_section}>
        <p className={styles.lead}>{leadText}</p>

        <div className={`${styles.ticket} chamfer chamfer-l punch`}>
          <div className={styles.ticket_stub}>
            <span className={styles.stub_text}>Tattoo Station</span>
          </div>
          <div className={styles.ticket_perforation} aria-hidden="true" />
          <div className={styles.ticket_main}>
            <span className={styles.eyebrow}>{ticketEyebrow}</span>
            <div className={styles.route}>
              <span>{routeFrom}</span>
              <span className={styles.route_arrow} aria-hidden="true">&rarr;</span>
              <span>{routeTo}</span>
            </div>
            <NavButton to={COUPON_URL} buttonText={ctaText} newTab />
            <span className={styles.cta_note}>{ctaNote}</span>
          </div>
        </div>
      </section>
    </main>
  )
}