import { getIntlayer, validatePrefix } from "intlayer";
import { useIntlayer } from "react-intlayer";
import { data } from "react-router";
import type { Route } from "./+types/faq";
import styles from "./faq.module.css";
import Accordion from "~/components/Accordion/Accordion";
import { LocalizedLink } from "~/components/intlayer/LocalizedLink";

export const loader = ({ params }: Route.LoaderArgs) => {
  const { lang: locale } = params;

  const { isValid } = validatePrefix(locale);

  if (!isValid) {
    throw data("Locale not supported", { status: 404 });
  }
};

export const meta: Route.MetaFunction = ({ params }) => {
  const content = getIntlayer("faq", params.lang);

  return [
    { title: content.title },
    { content: content.description, name: "description" },
  ];
};
// Intlayer end

export const handle = {
  titleBoard: {
    show: true,
    labelKey: "faq",
    timing: { characterStaggerSeconds: 0.03, minimumFlapCount: 10 },
  },
};

export default function faq() {
  const {
    buttonTextAftercare,
    buttonTextPiercing,
    beforeHeading,
    designHeading,
    bookingHeading,
  } = useIntlayer("faq");
  const { items: before } = useIntlayer("faq-before");
  const { items: design } = useIntlayer("faq-design");
  const { items: booking } = useIntlayer("faq-booking");

  return (
    <main className={styles.faq_main}>
      <div className={styles.directions_container}>
        <div className={styles.directions_wrapper}>
          <LocalizedLink
            to={"/aftercare"}
            className="button_a chamfer chamfer-xs punch"
          >
            {buttonTextAftercare}
          </LocalizedLink>
        </div>
        <div className={styles.directions_wrapper}>
          <LocalizedLink
            to={"/piercing/#piercing_faq"}
            className="button_b chamfer chamfer-xs punch"
          >
            {buttonTextPiercing}
          </LocalizedLink>
        </div>
      </div>
      <section className={styles.section_faq}>
        <div className={styles.accordion_wrapper}>
          <h2>{designHeading}</h2>
          <Accordion items={design} />
        </div>
        <div className={styles.accordion_wrapper}>
          <h2>{bookingHeading}</h2>
          <Accordion items={booking} />
        </div>
        <div className={styles.accordion_wrapper}>
          <h2>{beforeHeading}</h2>
          <Accordion items={before} />
        </div>
      </section>
    </main>
  );
}
