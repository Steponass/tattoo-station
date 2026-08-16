import { getIntlayer, validatePrefix } from "intlayer";
import { useIntlayer } from "react-intlayer";
import { data } from "react-router";
import type { Route } from "./+types/aftercareTattoo";
import styles from "./aftercareTattoo.module.css";

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

export const handle = {
  titleBoard: {
    show: true,
    labelKey: "aftercareTattoo",
    timing: { characterStaggerSeconds: 0.03, minimumFlapCount: 10 },
  },
};

export default function aftercareTattoo() {
  const {
    introPara,
    section1Heading,
    section1Para1,
    section1Para2,
    section2Heading,
    section2Para1,
    section2Para2,
    section2Para3,
    section3Heading,
    section3Para1,
    section3Para2,
    section4Heading,
    section4Para1,
    section4Para2,
    section4Para3,
    section5Heading,
    section5Para1,
    section5Para2,
    section6Heading,
    section6Para1,
    section6Para2,
    section6Para3,
    section7Heading,
    section7Para1,
    section7Para2,
    section7Para3,
    section8Heading,
    section8Para1,
    section8Para2,
    section9Heading,
    section9Para1,
    section9Para2,
    section10Heading,
    section10Para1,
    section10Para2,
    section10Para3,
    section10Para4,
    section11Heading,
    section11Para1,
    section11Para2,
    section11Para3,
    section12Heading,
    section12Para1,
    section12Para2,
    section12Para3,
    section12Para4,
    section13Heading,
    section13Para1,
    section13Para2,
  } = useIntlayer("aftercareTattoo");

  return (
    <main id={styles.tattoo_aftercare_main}>
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
          <p>
            {section2Para2}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="4em"
              height="4em"
              viewBox="0 0 48 48"
              id={styles.wash_hands}
            >
              <path
                fill="currentColor"
                d="M6 30a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1v10.996a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1zm14.915-.811s-2.278-.425-3.21 0c-.694.316-3.38 1.28-4.705 1.752v8.86c.767-.044 2.293-.125 2.945-.099c3.756.151 5.673 1.734 9.422 2.018c2.097.159 3.934.53 5.384 0c1.45-.531 9.732-4.566 10.767-5.628s.518-3.93-2.692-3.399s-7.454 3.08-9.214 2.974s-6.42-.956-6.42-.956l5.35.065s.756.04 1.794-.702c1.04-.742 1.968-2.867.415-2.867s-3.21-.532-3.21-.532z"
              />
              <path
                fill="var(--color-secondary)"
                d="M26 20.429c0 2-1.54 3.571-3.5 3.571S19 22.429 19 20.429S22.5 14 22.5 14s3.5 4.571 3.5 6.429"
              />
              <path
                fill="var(--color-secondary)"
                d="M41 16.132C41 18.836 38.778 21 36 21s-5-2.163-5-4.868C31 13.428 36 6 36 6s5 7.428 5 10.132"
              />
            </svg>
          </p>
          <p>{section2Para3}</p>
        </section>

        <section className={styles.aftercare_section}>
          <h2 className={styles.aftercare_heading}>{section3Heading}</h2>
          <p>{section3Para1}</p>
          <p>{section3Para2}</p>
        </section>

        <section className={styles.aftercare_section}>
          <h2 className={styles.aftercare_heading}>{section4Heading}</h2>
          <p>{section4Para1}
            <svg xmlns="http://www.w3.org/2000/svg" 
            width="4em" height="4em" 
            viewBox="0 0 24 24"
            id={styles.cream}
            >
              <path fill="currentColor" d="M6 9h12.11a.51.51 0 0 0 .39-.19c1.83-2.29 2-5.07.44-8.26a1 1 0 0 0-.81-.55a.91.91 0 0 0-.87.45c-.79 1.23-1.8 2.44-4.73 2.44c-6.92 0-7 5.56-7 5.61A.5.5 0 0 0 6 9m17 5.25H1a1 1 0 0 0-1 1v6.25A2.5 2.5 0 0 0 2.5 24h19a2.5 2.5 0 0 0 2.5-2.5v-6.25a1 1 0 0 0-1-1m-3 6.25a.5.5 0 0 1-.5.5h-15a.5.5 0 0 1-.5-.5v-2.75a.5.5 0 0 1 .5-.5h15a.5.5 0 0 1 .5.5ZM3.26 13h17.48a.51.51 0 0 0 .4-.8c-.55-.73-1.41-1.92-2.39-1.92H5.25c-1 0-1.84 1.19-2.39 1.92a.51.51 0 0 0 .4.8"/></svg></p>
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
          <p>
            {section7Para1}
            <svg
              id={styles.no_swimming_icon}
              viewBox="0 0 60.601004 60.601004"
              fill="var(--color-accent)"
            >
              <path
                d="m 20.925501,30.834878 c 0,-2.03875 -1.65,-3.68875 -3.6875,-3.68875 -2.0375,0 -3.6875,1.65 -3.6875,3.68875 0,2.035 1.65,3.6875 3.6875,3.6875 2.0375,0 3.6875,-1.6525 3.6875,-3.6875"
                style={{
                  fill: "#ffffff",
                  fillOpacity: 1,
                  fillRule: "nonzero",
                  stroke: "none",
                }}
              ></path>
              <path
                d="m 32.425502,28.647378 c 2.6875,-2.7775 7.1125,-2.85625 9.8875,-0.17375 0.2375,0.22375 0.45,0.4625 0.6375,0.70875 l 3.2125,-1.9275 c -0.3875,-0.5025 -0.8125,-0.9825 -1.2875,-1.4375 -5.0875,-4.91875 -13.2125,-4.77625 -18.125,0.3175 -0.75,0.76875 -1.375,1.6075 -1.8875,2.49625 l -3.65,6.33375 -3.0875,2.5625 c 0.6375,0.3175 1.3625,0.495 2.125,0.495 1.3,0 2.4875,-0.5225 3.3625,-1.37375 l 0.5625,0 c 0.875,0.85125 2.0625,1.37375 3.3625,1.37375 1.3125,0 2.5,-0.5225 3.3625,-1.37375 l 0.575,0 c 0.8625,0.85125 2.05,1.37375 3.3625,1.37375 1.3125,0 2.5,-0.5225 3.3625,-1.37375 l 0.575,0 c 0.8625,0.85125 2.05,1.37375 3.3625,1.37375 0.9875,0 1.9,-0.29625 2.6625,-0.805 l -13.1625,-7.5975 c 0.225,-0.34 0.4875,-0.6675 0.7875,-0.9725"
                style={{
                  fill: "#ffffff",
                  fillOpacity: 1,
                  fillRule: "nonzero",
                  stroke: "none",
                }}
              ></path>
              <path
                d="m 47.238003,44.138628 -30.775,-30.77125 c 3.775,-3.10625 8.6125,-4.9725003 13.8875,-4.9725003 12.0625,0 21.85,9.7900003 21.85,21.8625003 0,5.27125 -1.8625,10.1075 -4.9625,13.88125 z m -16.8875,7.98375 c -12.0875,0 -21.8750003,-9.79 -21.8750003,-21.865 0,-5.22625 1.8375003,-10.02625 4.9000003,-13.7875 l 30.7625,30.75 c -3.775,3.0625 -8.5625,4.9025 -13.7875,4.9025 z m -0.05,-49.1512503 c -15.0875,0 -27.3250003,12.2362503 -27.3250003,27.3312503 0,15.09125 12.2375003,27.3275 27.3250003,27.3275 15.0875,0 27.325,-12.23625 27.325,-27.3275 0,-15.095 -12.2375,-27.3312503 -27.325,-27.3312503"
                style={{
                  fill: "var(--color-accent)",
                  fillOpacity: 1,
                  fillRule: "nonzero",
                  stroke: "none",
                }}
              ></path>
            </svg>
          </p>
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
          <p>{section10Para2}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="5em"
              height="5em"
              viewBox="0 0 24 24"
              id={styles.sun_icon}
            >
              <g transform="translate(12,12) scale(0.55) translate(-12,-12)">
                <path fill="currentColor" d="m24 14.358l-3.04-2.965l2.608-3.348l-4.114-1.051l.584-4.204l-4.088 1.142L14.35 0l-2.965 3.04L8.037.432L6.986 4.546l-4.204-.584l1.142 4.087l-3.932 1.596l3.04 2.966l-2.608 3.348l4.114 1.051l-.59 4.204l4.087-1.142l1.6 3.932l2.965-3.04l3.348 2.608l1.051-4.114l4.205.59l-1.142-4.087zm-9.719 4.302a7.04 7.04 0 1 1 4.378-8.99l.015.049c.24.679.378 1.461.378 2.276a7.04 7.04 0 0 1-4.722 6.649l-.049.015z"/>
              </g>
              <g transform="scale(0.396033)">
                <path
                  d="m 47.238003,44.138628 -30.775,-30.77125 c 3.775,-3.10625 8.6125,-4.9725003 13.8875,-4.9725003 12.0625,0 21.85,9.7900003 21.85,21.8625003 0,5.27125 -1.8625,10.1075 -4.9625,13.88125 z m -16.8875,7.98375 c -12.0875,0 -21.8750003,-9.79 -21.8750003,-21.865 0,-5.22625 1.8375003,-10.02625 4.9000003,-13.7875 l 30.7625,30.75 c -3.775,3.0625 -8.5625,4.9025 -13.7875,4.9025 z m -0.05,-49.1512503 c -15.0875,0 -27.3250003,12.2362503 -27.3250003,27.3312503 0,15.09125 12.2375003,27.3275 27.3250003,27.3275 15.0875,0 27.325,-12.23625 27.325,-27.3275 0,-15.095 -12.2375,-27.3312503 -27.325,-27.3312503"
                  style={{
                    fill: "var(--color-accent)",
                    fillOpacity: 1,
                    fillRule: "nonzero",
                    stroke: "none",
                  }}
                ></path>
              </g>
            </svg>
          </p>
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
  );
}
