import { getIntlayer, validatePrefix } from "intlayer";
import { useIntlayer } from "react-intlayer";
import { data } from "react-router";
import type { Route } from "./+types/home";
import LandingGallery from "~/components/LandingGallery/LandingGallery";
import Process from "~/components/Process/Process";
import NavButton from "~/components/Button/NavButton";
import Testimonials from "~/components/Testimonials/Testimonials";
import styles from './home.module.css'

export const loader = ({ params }: Route.LoaderArgs) => {
const { lang: locale } = params;

  const { isValid } = validatePrefix(locale);

  if (!isValid) {
    throw data("Locale not supported", { status: 404 });
  }
};

export const meta: Route.MetaFunction = ({ params }) => {
  const content = getIntlayer("home", params.lang);

  return [
    { title: content.title },
    { content: content.description, name: "description" },
  ];
};
// Intlayer end

export const handle = {
  titleBoard: { show: true, labelKey: "home" },
};

export default function Home() {
  const { buttonTextArtists } = useIntlayer("home")
  
  return (
    <>
      <section className={styles.hero_section}>

      <h2>One stop. Countless directions</h2>
      <NavButton
          className={styles.nav_button}
          buttonText={buttonTextArtists}
          to={"/artists"}/>
      </section>
      <LandingGallery />

      <Process />

      <Testimonials />
    </>
  );
}
