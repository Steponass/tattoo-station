import { useEffect, useState } from "react";
import styles from "./ScrollToTop.module.css"

const SCROLL_THRESHOLD = 500;

const handleClick = () => {
  window.scrollTo({ top: 0, behavior: "smooth" });
};

export default function ScrollToTop() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setIsVisible(window.scrollY > SCROLL_THRESHOLD);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <button
      onClick={handleClick}
      className={`${styles.scrollToTop} ${isVisible ? styles.visible : ""}`}
    >
      
<svg xmlns="http://www.w3.org/2000/svg" width="64px" height="64px" viewBox="0 0 24 24"><title>Scroll to top</title><path fill="currentColor" d="m12 3.879l-7.061 7.06l2.122 2.122L12 8.121l4.939 4.94l2.122-2.122z"/><path fill="currentColor" d="m4.939 17.939l2.122 2.122L12 15.121l4.939 4.94l2.122-2.122L12 10.879z"/></svg>    </button>
  );
}
