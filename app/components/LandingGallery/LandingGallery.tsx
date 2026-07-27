import { useEffect, useRef } from "react";
import styles from "./LandingGallery.module.css";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { LocalizedLink } from "../intlayer/LocalizedLink";
gsap.registerPlugin(ScrollTrigger);

export default function LandingGallery() {
  const landingGalleryContainerRef = useRef<HTMLDivElement>(null);
  const landingGalleryTopRef = useRef<HTMLDivElement>(null);
  const landingGalleryBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const landingGalleryContainer = landingGalleryContainerRef.current;
    const landingGalleryTop = landingGalleryTopRef.current;
    const landingGalleryBottom = landingGalleryBottomRef.current;

    const ctx = gsap.context(() => {

      gsap.set(landingGalleryBottom,
        {
          xPercent: -40
        }
      )
      const timeline = gsap.timeline({
        scrollTrigger: {
          trigger: landingGalleryContainer,
          start: "10px 15%",
          end: "+=100%",
          scrub: 1,
          pin: true,
        },
      });


      timeline.to(
        landingGalleryTop, 
        { xPercent: -30 });

      timeline.to(
        landingGalleryBottom, 
        { xPercent: -10 });

    }, landingGalleryContainer ?? undefined);

    return () => ctx.revert();
  }, []);

  return (
    <section>
      <div
        className={styles.landing_gallery_container}
        ref={landingGalleryContainerRef}
      >
        <div className={styles.landing_gallery_top} ref={landingGalleryTopRef}>
          <LocalizedLink to="/Pimpi">
            <div className={styles.placeholder}><img src="/public/TEMP-Logo-from-photo.webp"/></div>
          </LocalizedLink>
          <LocalizedLink to="/Pimpi">
            <div className={styles.placeholder}></div>
          </LocalizedLink>
          <LocalizedLink to="/Pimpi">
            <div className={styles.placeholder}></div>
          </LocalizedLink>
          <LocalizedLink to="/Pimpi">
            <div className={styles.placeholder}></div>
          </LocalizedLink>
          <LocalizedLink to="/Pimpi">
            <div className={styles.placeholder}></div>
          </LocalizedLink>
          <LocalizedLink to="/Pimpi">
            <div className={styles.placeholder}></div>
          </LocalizedLink>
          <LocalizedLink to="/Pimpi">
            <div className={styles.placeholder}></div>
          </LocalizedLink>
          <LocalizedLink to="/Pimpi">
            <div className={styles.placeholder}></div>
          </LocalizedLink>
          <LocalizedLink to="/Pimpi">
            <div className={styles.placeholder}></div>
          </LocalizedLink>
          <LocalizedLink to="/Pimpi">
            <div className={styles.placeholder}></div>
          </LocalizedLink>
        </div>
        <div
          className={styles.landing_gallery_bottom}
          ref={landingGalleryBottomRef}
        >
          <LocalizedLink to="/Pimpi">
            <div className={styles.placeholder}></div>
          </LocalizedLink>
          <LocalizedLink to="/Pimpi">
            <div className={styles.placeholder}></div>
          </LocalizedLink>
          <LocalizedLink to="/Pimpi">
            <div className={styles.placeholder}></div>
          </LocalizedLink>
          <LocalizedLink to="/Pimpi">
            <div className={styles.placeholder}></div>
          </LocalizedLink>
          <LocalizedLink to="/Pimpi">
            <div className={styles.placeholder}><img src="/public/TEMP-Logo-from-photo.webp"/></div>
          </LocalizedLink>
          <LocalizedLink to="/Pimpi">
            <div className={styles.placeholder}></div>
          </LocalizedLink>
          <LocalizedLink to="/Pimpi">
            <div className={styles.placeholder}></div>
          </LocalizedLink>
          <LocalizedLink to="/Pimpi">
            <div className={styles.placeholder}></div>
          </LocalizedLink>
          <LocalizedLink to="/Pimpi">
            <div className={styles.placeholder}></div>
          </LocalizedLink>
          <LocalizedLink to="/Pimpi">
            <div className={styles.placeholder}></div>
          </LocalizedLink>
        </div>
      </div>
    </section>
  );
}
