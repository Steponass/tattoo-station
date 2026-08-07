import type { ReactNode } from 'react'
import AccordionItem from './AccordionItem'
import styles from './Accordion.module.css'
type AccordionProps = {
  items: {
    question: string
    answer: ReactNode
  }[]
}

export default function Accordion({ items }: AccordionProps) {
  return (
    <div className={`${styles.accordion_wrapper} chamfer chamfer-s`}>
      {items.map((accordionItem, index) => (
        <AccordionItem
          key={index}
          question={String(accordionItem.question)}
          answer={accordionItem.answer}
        />
      ))}
    </div>
  )
}
