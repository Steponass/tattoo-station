// Intlayer start
import { getIntlayer, validatePrefix } from "intlayer";
import { useIntlayer } from "react-intlayer";
import { data } from "react-router";
import type { Route } from "./+types/aftercareTattoo";
import styles from './aftercareTattoo.module.css'

export const loader = ({ params }: Route.LoaderArgs) => {
  const { lang } = params;

  const { isValid } = validatePrefix(lang);

  if (!isValid) {
    throw data("Locale not supported", { status: 404 });
  }
};

export const meta: Route.MetaFunction = ({ params }) => {
  const content = getIntlayer("aftercareTattoo", params.lang);

  return [
    { title: content.title },
    { content: content.description, name: "description" },
  ];
};
// Intlayer end

export default function aftercareTattoo() {
  const {
    pageHeading, introHeading, introPara,
    section1Heading, section1Para1, section1Para2,
    section2Heading, section2Para1, section2Para2, section2Para3,
    section3Heading, section3Para1, section3Para2,
    section4Heading, section4Para1, section4Para2, section4Para3,
    section5Heading, section5Para1, section5Para2,
    section6Heading, section6Para1, section6Para2, section6Para3,
    section7Heading, section7Para1, section7Para2, section7Para3,
    section8Heading, section8Para1, section8Para2,
    section9Heading, section9Para1, section9Para2,
    section10Heading, section10Para1, section10Para2, section10Para3, section10Para4,
    section11Heading, section11Para1, section11Para2, section11Para3,
    section12Heading, section12Para1, section12Para2, section12Para3, section12Para4,
    section13Heading, section13Para1, section13Para2,
  } = useIntlayer("aftercareTattoo");

  return (
    <main id={styles.tattoo_aftercare_main}>
      <h1 className={styles.aftercare_page_heading}>{pageHeading}</h1>
      <h2 className={styles.aftercare_intro_heading}>{introHeading}</h2>
      <p className={styles.aftercare_intro_para}>{introPara}</p>

<div className={styles.tattoo_aftercare_section_container}>
      <section className={styles.aftercare_section}>
        <h2 className={styles.aftercare_heading}>{section1Heading}</h2>
        <p>{section1Para1}</p>
        <p>{section1Para2}</p>
      </section>

      <section className={styles.aftercare_section}>
        <h2 className={styles.aftercare_heading}>{section2Heading}</h2>
        <p>{section2Para1}</p>
        <p>{section2Para2}</p>
        <p>{section2Para3}</p>
      </section>

      <section className={styles.aftercare_section}>
        <h2 className={styles.aftercare_heading}>{section3Heading}</h2>
        <p>{section3Para1}</p>
        <p>{section3Para2}</p>
      </section>

      <section className={styles.aftercare_section}>
        <h2 className={styles.aftercare_heading}>{section4Heading}</h2>
        <p>{section4Para1}</p>
        <p>{section4Para2}</p>
        <p>{section4Para3}</p>
      </section>

      <section className={styles.aftercare_section}>
        <h2 className={styles.aftercare_heading}>{section5Heading}</h2>
        <p>{section5Para1}</p>
        <p>{section5Para2}</p>
      </section>

      <section className={styles.aftercare_section}>
        <h2 className={styles.aftercare_heading}>{section6Heading}</h2>
        <p>{section6Para1}</p>
        <p>{section6Para2}</p>
        <p>{section6Para3}</p>
      </section>

      <section className={styles.aftercare_section}>
        <h2 className={styles.aftercare_heading}>{section7Heading}</h2>
        <p>{section7Para1}</p>
        <p>{section7Para2}</p>
        <p>{section7Para3}</p>
      </section>

      <section className={styles.aftercare_section}>
        <h2 className={styles.aftercare_heading}>{section8Heading}</h2>
        <p>{section8Para1}</p>
        <p>{section8Para2}</p>
      </section>

      <section className={styles.aftercare_section}>
        <h2 className={styles.aftercare_heading}>{section9Heading}</h2>
        <p>{section9Para1}</p>
        <p>{section9Para2}</p>
      </section>

      <section className={styles.aftercare_section}>
        <h2 className={styles.aftercare_heading}>{section10Heading}</h2>
        <p>{section10Para1}</p>
        <p>{section10Para2}</p>
        <p>{section10Para3}</p>
        <p>{section10Para4}</p>
      </section>

      <section className={styles.aftercare_section}>
        <h2 className={styles.aftercare_heading}>{section11Heading}</h2>
        <p>{section11Para1}</p>
        <p>{section11Para2}</p>
        <p>{section11Para3}</p>
      </section>

      <section className={styles.aftercare_section}>
        <h2 className={styles.aftercare_heading}>{section12Heading}</h2>
        <p>{section12Para1}</p>
        <p>{section12Para2}</p>
        <p>{section12Para3}</p>
        <p>{section12Para4}</p>
      </section>

      <section className={styles.aftercare_section}>
        <h2 className={styles.aftercare_heading}>{section13Heading}</h2>
        <p>{section13Para1}</p>
        <p>{section13Para2}</p>
      </section>
      </div>
    </main>
  )
}
