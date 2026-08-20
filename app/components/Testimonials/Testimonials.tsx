import { useEffect, useRef } from "react"
import { useIntlayer } from "react-intlayer"
import styles from './Testimonials.module.css'
import NavButton from "~/components/Button/NavButton"

import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { Draggable } from "gsap/Draggable"
import { InertiaPlugin } from "gsap/InertiaPlugin"
gsap.registerPlugin(Draggable, InertiaPlugin, ScrollTrigger)

const DISMISS_DISTANCE_FRACTION = 0.25 
const FLY_DURATION = 0.4
const FLY_EASE = "power1.in"
const SNAP_DURATION = 0.3
const SNAP_EASE = "back.out(1)"


export default function Testimonials() {

  const { items, heading, resetButtonText, moreReviewsButtonText } = useIntlayer("Testimonials")
  const testimonialContainerRef = useRef<HTMLDivElement>(null)
  const cardRefs = useRef<(HTMLDivElement | null)[]>([])
  const draggablesRef = useRef<Draggable[]>([])
  const iconSwipeRef = useRef<SVGSVGElement>(null)

  useEffect(() => {
    const icon = iconSwipeRef.current
    if (!icon) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return
        icon.classList.remove(styles.play)
        void icon.getBoundingClientRect() // force reflow so the animation restarts
        icon.classList.add(styles.play)
      },
      { threshold: 1 }
    )

    observer.observe(icon)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const testimonialContainer = testimonialContainerRef.current
    const cards = cardRefs.current.filter((card): card is HTMLDivElement => card !== null)

    if (!testimonialContainer || cards.length === 0) return

    const draggables = Draggable.create(cards, {

      inertia: true,
      onThrowUpdate(this: Draggable) {
        const card = this.target as HTMLDivElement
        const rect = testimonialContainer.getBoundingClientRect()
        const distanceThreshold = Math.min(rect.width, rect.height) * DISMISS_DISTANCE_FRACTION
        const distance = Math.hypot(this.x, this.y)

        if (distance < distanceThreshold) return // still coasting within bounds, not gone yet

        const vx = InertiaPlugin.getVelocity(card, "x")
        const vy = InertiaPlugin.getVelocity(card, "y")
        const speed = Math.hypot(vx, vy)
        const [dx, dy] = speed > 1 ? [vx, vy] : [this.x, this.y]
        const len = Math.hypot(dx, dy) || 1
        const ux = dx / len, uy = dy / len
        const flyDistance = Math.max(window.innerWidth, window.innerHeight) * 1.5

        this.disable()
        this.tween?.kill()
        gsap.to(card, {
          x: this.x + ux * flyDistance,
          y: this.y + uy * flyDistance,
          duration: FLY_DURATION,
          ease: FLY_EASE,
          overwrite: true,
        })
      },
      onThrowComplete(this: Draggable) {
        gsap.to(this.target, {
          x: 0,
          y: 0,
          duration: SNAP_DURATION,
          ease: SNAP_EASE,
          overwrite: true,
        })
      },
    });

    draggablesRef.current = draggables

    return () => {
      draggables.forEach((draggable) => draggable.kill())
      draggablesRef.current = []
    }
  }, []);

  function handleReset() {
    draggablesRef.current.forEach((draggable) => {
      draggable.tween?.kill()
      gsap.to(draggable.target, {
        x: 0,
        y: 0,
        duration: SNAP_DURATION,
        ease: SNAP_EASE,
        overwrite: true,
        onComplete: () => draggable.update(true),
      })
      draggable.enable()
    })
  }


  return(
    <section className={styles['section-testimonials']}>
        <h2 className={styles.section_heading}>{heading}</h2>
        <div className={styles['testimonials-container']}
            ref={testimonialContainerRef}>
          <svg ref={iconSwipeRef} className={styles.icon_swipe}
      xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24"><g fill="none" stroke="white" strokeLinecap="round" strokeWidth="1.5"><path strokeLinejoin="round" d="M21.001 4.5h-6m6 0c0-.7-1.994-2.009-2.5-2.5m2.5 2.5c0 .7-1.994 2.008-2.5 2.5"/><path d="M6.513 13.515V3.485a1.489 1.489 0 0 1 2.979 0v5.203m0 0v2.323m0-2.323c.805-1.119 2.607-.746 2.99.993q.01.043.017.087m.015 1.24v-1.003q0-.12-.015-.237m0 0c.493-1.35 2.757-.835 3.004 1.093m0 0v1.146m0-1.146c.404-1.49 3.056-.449 2.998 1.293v3.179c-.003 1.726-.29 2.978-1.317 4.007c-.948 1.132-.725 1.765-.749 2.662M6.513 8.99c-1.32 1.193-2.816 2.825-3.007 3.211c-.89 1.352-.573 2.413.69 4.216c.941 1.34 2.203 2.835 2.269 2.91c.672.762.54 1.368.54 2.663"/></g>
          </svg>
            <div className={styles.testimonials_button_container}>
            <button className={`${styles.reset_button} button_b chamfer chamfer-xs punch`}
                  onClick={handleReset}>
              {resetButtonText}
            </button>
            <NavButton buttonText={moreReviewsButtonText}
                  newTab
                  to={'https://www.google.com/maps/place/Tattoo+Station+Est.+2020/@54.6721408,25.289544,17z/data=!4m18!1m9!3m8!1s0x46dd95be0ee521f3:0x836264376174f856!2sTattoo+Station+Est.+2020!8m2!3d54.6721408!4d25.289544!9m1!1b1!16s%2Fg%2F11rp447y5d!3m7!1s0x46dd95be0ee521f3:0x836264376174f856!8m2!3d54.6721408!4d25.289544!9m1!1b1!16s%2Fg%2F11rp447y5d?entry=ttu&g_ep=EgoyMDI2MDcyOS4wIKXMDSoASAFQAw%3D%3D'}/>
            </div>
            {items.map((item, index) => (
              <div className={styles['testimonial-card']}
                    key={String(item.name)}
                    ref={(el) => { cardRefs.current[index] = el }}>
                <p className={styles.testimonial_text}>{item.text}</p>
                <p className={styles.testimonial_name}>{item.name}</p>
              </div>
            ))}
        </div>
    </section>
  )
}