import { getIntlayer, validatePrefix } from "intlayer";
import { useIntlayer } from "react-intlayer";
import { data } from "react-router";
import type { Route } from "./+types/faq";
import styles from "./faq.module.css";
import Accordion from "~/components/Accordion/Accordion";
import NavButton from "~/components/Button/NavButton";

// Intlayer start
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
  const { aftercare_directions, piercing_directions, buttonTextAftercare, buttonTextPiercing, beforeHeading, designHeading, bookingHeading } = useIntlayer("faq");
  const { items: before } = useIntlayer("faq-before");
  const { items: design } = useIntlayer("faq-design");
  const { items: booking } = useIntlayer("faq-booking");

  return (
    <main className={styles.faq_main}>
              <div className={styles.directions_container}>
          <div className={styles.directions_wrapper}>
          <NavButton buttonText={buttonTextAftercare} to={"/aftercare"} />
          </div>
          <div className={styles.directions_wrapper}>
          <NavButton 
          buttonText={buttonTextPiercing} 
          to={"/piercing/#piercing_faq"} />
          </div>
        </div>
      <section className={styles.section_faq}>

         <div className={styles.accordion_wrapper}>
          <h2>{designHeading}</h2>
          <Accordion items={design} />
        </div>
        <div className={styles.accordion_wrapper}>
          <h2>{beforeHeading}</h2>
          <Accordion items={before} />
        </div>
        <div className={styles.accordion_wrapper}>
          <h2>{bookingHeading}</h2>
          <Accordion items={booking} />
        </div>
      </section>
    </main>
  );
}
