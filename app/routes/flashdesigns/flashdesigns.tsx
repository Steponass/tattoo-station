import styles from "./flashdesigns.module.css";

// Intlayer start
import { getIntlayer, validatePrefix } from "intlayer";
import { useIntlayer, useLocale } from "react-intlayer";
import { data } from "react-router";
import type { Route } from "./+types/flashdesigns";
import FlashTattooGallery from "~/components/FlashTattooGallery/FlashTattooGallery";

// Intlayer Start
export const loader = ({ params }: Route.LoaderArgs) => {
  const { lang } = params;

  const { isValid } = validatePrefix(lang);

  if (!isValid) {
    throw data("Locale not supported", { status: 404 });
  }
};

export const meta: Route.MetaFunction = ({ params }) => {
  const content = getIntlayer("flashdesigns", params.lang);

  return [
    { title: content.title },
    { content: content.description, name: "description" },
  ];
};
// Intlayer end

export default function flashdesigns() {
  return (
    <main>
      <FlashTattooGallery />
    </main>
  )
}