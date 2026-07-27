import styles from "./aftercare.module.css";
import { LocalizedLink } from "~/components/intlayer/LocalizedLink";

// Intlayer start
import { getIntlayer, validatePrefix } from "intlayer";
import { useIntlayer, useLocale } from "react-intlayer";
import { data } from "react-router";
import type { Route } from "./+types/page";

// Intlayer Start
export const loader = ({ params }: Route.LoaderArgs) => {
  const { lang: locale } = params;

  const { isValid } = validatePrefix(locale);

  if (!isValid) {
    throw data("Locale not supported", { status: 404 });
  }
};

export const meta: Route.MetaFunction = ({ params }) => {
  const content = getIntlayer("aftercare", params.lang);

  return [
    { title: content.title },
    { content: content.description, name: "description" },
  ];
};

export const handle = {
  titleBoard: { show: true, labelKey: "aftercare" },
};
// Intlayer end

export default function aftercare() {
  const { tattooAftercare, piercingAftercare } = useIntlayer("aftercare");

  return (
    <main>
      <section className={styles.section_aftercare_links}>
      <LocalizedLink to="aftercare/aftercareTattoo" viewTransition>
        <div className={styles.tattoo_aftercare_card}>
          <div className={styles.tattoo_aftercare_backdrop} />
          <div className={styles.tattoo_aftercare_wrapper}>
            <p>{tattooAftercare}</p>
          </div>
        </div>
      </LocalizedLink>
        <LocalizedLink to="aftercare/aftercarePiercing" viewTransition>
          <div className={styles.piercing_aftercare_card}>
            <div className={styles.piercing_aftercare_backdrop} />
            <div className={styles.piercing_aftercare_wrapper}>
              <p>{piercingAftercare}</p>
            </div>
          </div>
        </LocalizedLink>
      </section>
    </main>
  );
}