import styles from "./tattoostyles.module.css";

// Intlayer start
import { getIntlayer, validatePrefix } from "intlayer";
import { useIntlayer } from "react-intlayer";
import { data } from "react-router";
import type { Route } from "./+types/tattoostyles";
import StyleGallery from "~/components/StyleGallery/StyleGallery";
import { useLightboxLabels } from "~/components/Lightbox/useLightboxLabels";

// Intlayer Start
export const loader = ({ params }: Route.LoaderArgs) => {
  const { lang: locale } = params;

  const { isValid } = validatePrefix(locale);

  if (!isValid) {
    throw data("Locale not supported", { status: 404 });
  }
};

export const meta: Route.MetaFunction = ({ params }) => {
  const content = getIntlayer("tattoostyles", params.lang);

  return [
    { title: content.title },
    { content: content.description, name: "description" },
  ];
};
// Intlayer end

export default function tattoostyles() {
  const content = useIntlayer("tattoostyles");
  const lightboxLabels = useLightboxLabels();

  return (
    <main>
      <article className={styles.tattoostyle_article}>
        <h2 className="text-3xl">{content.neoTraditionalHeading}</h2>
        <div className={styles.description_and_gallery_container}>
          <div className={styles.tattoostyle_description}>
            <img
              src="/illustrations/Neo_traditional_swallow.webp"
              alt={String(content.neoTraditionalImageAlt)}
            />
            <p>{content.neoTraditionalDescription}</p>
          </div>
          {/* <div className="pimpa bg-amber-50 h-4 w-full"></div> */}
          {/* No photos wired yet — the gallery renders its placeholder
              tiles until a loader supplies style-tagged photos. */}
          <StyleGallery labels={lightboxLabels} />
        </div>
      </article>
    </main>
  );
}
