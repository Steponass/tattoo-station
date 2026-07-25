import AccordionItem from './AccordionItem'
import styles from './Accordion.module.css'
type AccordionProps = {
  items: {
    question: string
    answer: string
  }[]
}

export default function Accordion({ items }: AccordionProps) {
  return (
    <div className={`${styles.accordion_wrapper} chamfer-s`}>
      {items.map((accordionItem, index) => (
        <AccordionItem
          key={index}
          question={String(accordionItem.question)}
          answer={String(accordionItem.answer)}
        />
      ))}
    </div>
  )
}
