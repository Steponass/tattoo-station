import { useEffect, useRef } from "react"
import styles from './Testimonials.module.css'
import NavButton from "~/components/Button/NavButton"

import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { Draggable } from "gsap/Draggable"
import { InertiaPlugin } from "gsap/InertiaPlugin"
gsap.registerPlugin(Draggable, InertiaPlugin, ScrollTrigger)

const DISMISS_DISTANCE_FRACTION = 0.45  // fraction of min(container width, height)
const FLY_DURATION = 0.4
const FLY_EASE = "power1.in"
const SNAP_DURATION = 0.3
const SNAP_EASE = "back.out(1)"


export default function Testimonials() {

  const testimonialContainerRef = useRef<HTMLDivElement>(null)
  const cardRefs = useRef<(HTMLDivElement | null)[]>([])
  const draggablesRef = useRef<Draggable[]>([])

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


        <div className={styles['testimonials-container']}
              ref={testimonialContainerRef}>
         <svg className={styles.icon_swipe}
      xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24"><g fill="none" stroke="white" stroke-linecap="round" stroke-width="1.5"><path stroke-linejoin="round" d="M21.001 4.5h-6m6 0c0-.7-1.994-2.009-2.5-2.5m2.5 2.5c0 .7-1.994 2.008-2.5 2.5"/><path d="M6.513 13.515V3.485a1.489 1.489 0 0 1 2.979 0v5.203m0 0v2.323m0-2.323c.805-1.119 2.607-.746 2.99.993q.01.043.017.087m.015 1.24v-1.003q0-.12-.015-.237m0 0c.493-1.35 2.757-.835 3.004 1.093m0 0v1.146m0-1.146c.404-1.49 3.056-.449 2.998 1.293v3.179c-.003 1.726-.29 2.978-1.317 4.007c-.948 1.132-.725 1.765-.749 2.662M6.513 8.99c-1.32 1.193-2.816 2.825-3.007 3.211c-.89 1.352-.573 2.413.69 4.216c.941 1.34 2.203 2.835 2.269 2.91c.672.762.54 1.368.54 2.663"/></g>
      </svg>
            <div className={styles.testimonials_button_container}>
            <button type="button" className={styles.reset_button}
                  onClick={handleReset}>
              Reset
            </button>
            </div>
            <NavButton buttonText={"more reviews"} to={'https:/google.com'}/>
            <div className={styles['testimonial-card']}
                  ref={(el) => { cardRefs.current[0] = el }}>
              <p className="testimonial-text">Lorem, ipsum dolor sit amet consectetur adipisicing elit. Eaque, exercitationem.</p>
              <p className="testimonial-name">Raimundėėėlis</p>
            </div>
            <div className={styles['testimonial-card']}
                  ref={(el) => { cardRefs.current[1] = el }}>
              <p className="testimonial-text">Lorem ipsum dolor sit amet.</p>
              <p className="testimonial-name">Steponėėėėėlis</p>
            </div>
            <div className={styles['testimonial-card']}
                  ref={(el) => { cardRefs.current[2] = el }}>
              <p className="testimonial-text">Gerai šemšių patvarkė, didžiulis ačiū komandai!</p>
              <p className="testimonial-name">Močiutė</p>
            </div>
            <div className={styles['testimonial-card']}
                  ref={(el) => { cardRefs.current[3] = el }}>
              <p className="testimonial-text">Lorem ipsum, dolor sit amet consectetur adipisicing elit. Ea, magnam nam exercitationem unde molestiae mollitia eveniet laborum at distinctio perspiciatis?</p>
              <p className="testimonial-name">Diedukas</p>
            </div>
            <div className={styles['testimonial-card']}
                  ref={(el) => { cardRefs.current[4] = el }}>
              <p className="testimonial-text">Lorem ipsum dolor, sit amet consectetur adipisicing elit. At minima suscipit officiis maxime obcaecati nobis.</p>
              <p className="testimonial-name">Stoties prostitutė</p>
            </div>
        </div>
    </section>
  )
}