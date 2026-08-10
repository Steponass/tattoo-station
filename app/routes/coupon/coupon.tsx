
import { getIntlayer, validatePrefix } from "intlayer";
import { useIntlayer } from "react-intlayer";
import { data } from "react-router";
import type { Route } from "./+types/coupon";
import styles from './coupon.module.css'

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

// SPLITFLAP BOARD
export const handle = {
  titleBoard: {
    show: true,
    labelKey: "coupon",
    timing: { characterStaggerSeconds: 0.03, minimumFlapCount: 10 },
  },
};

export default function coupon() {
  return(
    <main>
      
    </main>
  )
}