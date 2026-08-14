import { getIntlayer, validatePrefix } from "intlayer";
import { useIntlayer } from "react-intlayer";
import { data } from "react-router";
import type { Route } from "./+types/home";
import LandingGallery from "~/components/LandingGallery/LandingGallery";
import { useLightboxLabels } from "~/components/Lightbox/useLightboxLabels";
import Process from "~/components/Process/Process";
import NavButton from "~/components/Button/NavButton";
import Testimonials from "~/components/Testimonials/Testimonials";
import { getCloudflareBindings } from "~/lib/cloudflare/cloudflareContext";
import { findPlacedPhotos } from "~/lib/gallery/galleryPlacementRepository.server";
import styles from './home.module.css';
import ProcessNew from "~/components/ProcessNew/ProcessNew";

export const loader = async ({ params, context }: Route.LoaderArgs) => {
  const { lang: locale } = params;

  const { isValid } = validatePrefix(locale);

  if (!isValid) {
    throw data("Locale not supported", { status: 404 });
  }

  const { env } = getCloudflareBindings(context);

  // The home page hero gallery reads the same placements the admin curates
  // at /admin/landing. If nothing is placed, the LandingGallery component
  // returns null and the page renders without the hero section.
  const landingGalleryPhotos = await findPlacedPhotos({
    database: env.DB,
    gallery: "landing",
  });

  return { landingGalleryPhotos };
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
  titleBoard: { 
    show: true, 
    labelKey: "home",
      timing: { characterStaggerSeconds: 0.03, minimumFlapCount: 5 }, },
};

export default function Home({ loaderData }: Route.ComponentProps) {
  const { subheading, buttonTextArtists } = useIntlayer("home");
  const { landingGalleryPhotos } = loaderData;
  const lightboxLabels = useLightboxLabels();

  return (
    <>
      <section className={styles.hero_section}>
        <h2>{subheading}</h2>
        <NavButton
          buttonText={buttonTextArtists}
          to={"/artists"}
        />
      </section>

      <LandingGallery photos={landingGalleryPhotos} labels={lightboxLabels} />

      {/* <Process /> */}
      <ProcessNew />
      <Testimonials />
    </>
  );
}