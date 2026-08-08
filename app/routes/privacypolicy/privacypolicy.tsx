import { getIntlayer, validatePrefix } from "intlayer";
import { useIntlayer } from "react-intlayer";
import { data } from "react-router";
import type { Route } from "./+types/privacypolicy";
import styles from './privacypolicy.module.css'

// Intlayer start
export const loader = ({ params }: Route.LoaderArgs) => {
  const { lang: locale } = params;

  const { isValid } = validatePrefix(locale);

  if (!isValid) {
    throw data("Locale not supported", { status: 404 });
  }
};

export const meta: Route.MetaFunction = ({ params }) => {
  const content = getIntlayer("privacypolicy", params.lang);

  return [
    { title: content.title },
    { content: content.description, name: "description" },
  ];
};
// Intlayer end

export const handle = {
  titleBoard: {
    show: true,
    labelKey: "privacy",
    timing: { characterStaggerSeconds: 0.03, minimumFlapCount: 10 },
  },
};

/** The <h1> comes from PageTitleBoard, so the sections here start at <h2>. */
export default function privacypolicy() {
  const content = useIntlayer("privacypolicy");

  return (
    <main>
      <section className={styles.privacy_section}>
        <span>
          {content.lastUpdatedLabel}: {content.lastUpdated}
        </span>
        <p>{content.intro}</p>

        <article className={styles.privacy_article}>
          <h2>{content.controllerHeading}</h2>
          <p>{content.controllerBody}</p>
        </article>

        <article className={styles.privacy_article}>
          <h2>{content.dataHeading}</h2>
          <h3>{content.bookingDataLabel}</h3>
          <ul>
            {content.bookingDataItems.map((entry, index) => (
              <li key={index}>{entry.item}</li>
            ))}
          </ul>
          <h3>{content.technicalDataLabel}</h3>
          <ul>
            {content.technicalDataItems.map((entry, index) => (
              <li key={index}>{entry.item}</li>
            ))}
          </ul>
        </article>

        <article className={styles.privacy_article}>
          <h2>{content.purposeHeading}</h2>
          <p>{content.purposeIntro}</p>
          <ul>
            {content.purposeItems.map((entry, index) => (
              <li key={index}>{entry.item}</li>
            ))}
          </ul>
        </article>

        <article className={styles.privacy_article}>
          <h2>{content.retentionHeading}</h2>
          <p>{content.retentionBookingBody}</p>
          <p>{content.retentionOtherBody}</p>
        </article>

        <article className={styles.privacy_article}>
          <h2>{content.sharingHeading}</h2>
          <p>{content.sharingIntro}</p>
          <ul>
            {content.sharingItems.map((entry, index) => (
              <li key={index}>{entry.item}</li>
            ))}
          </ul>
          <p>{content.sharingOutro}</p>
        </article>

        <article className={styles.privacy_article}>
          <h2>{content.cookiesHeading}</h2>
          <p>{content.cookiesBody}</p>
        </article>

        <article className={styles.privacy_article}>
          <h2>{content.rightsHeading}</h2>
          <p>{content.rightsIntro}</p>
          <ul>
            {content.rightsItems.map((entry, index) => (
              <li key={index}>{entry.item}</li>
            ))}
          </ul>
          <p>{content.rightsOutro}</p>
        </article>

        <article className={styles.privacy_article}>
          <h2>{content.minorsHeading}</h2>
          <p>{content.minorsBody}</p>
        </article>

        <article className={styles.privacy_article}>
          <h2>{content.securityHeading}</h2>
          <p>{content.securityBody}</p>
        </article>

        <article className={styles.privacy_article}>
          <h2>{content.changesHeading}</h2>
          <p>{content.changesBody}</p>
        </article>

        <article className={styles.privacy_article}>
          <h2>{content.contactHeading}</h2>
          <address>{content.contactBody}</address>
        </article>
      </section>
    </main>
  );
}
