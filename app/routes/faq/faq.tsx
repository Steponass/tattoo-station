// Intlayer start
import { getIntlayer, validatePrefix } from "intlayer";
import { useIntlayer } from "react-intlayer";
import { data } from "react-router";
import type { Route } from "./+types/page";
import styles from './faq.module.css'
import Accordion from "~/components/Accordion/Accordion"
import NavButton from "~/components/Button/NavButton";

export const loader = ({ params }: Route.LoaderArgs) => {
const { lang: locale } = params;

  const { isValid } = validatePrefix(locale);

  if (!isValid) {
    throw data("Locale not supported", { status: 404 });
  }
};

export const meta: Route.MetaFunction = ({ params }) => {
  const content = getIntlayer("faq", params.locale);

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
const { aftercare_directions, buttonTextAftercare } = getIntlayer("faq");
const { items: before } = useIntlayer("faq-before");
const { items: design } = useIntlayer("faq-design");
const { items: booking } = useIntlayer("faq-booking");

  return (
    <main>
        <section className={styles.section_faq}>
        <div>
          <h6>{aftercare_directions}</h6>
          <NavButton 
          buttonText={buttonTextAftercare}
          to={"/aftercare"}/>
        </div>
        <Accordion items={before} />
        <Accordion items={design} />
        <Accordion items={booking} />
        </section>
    </main>
  )
}