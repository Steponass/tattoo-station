import AccordionItem from './AccordionItem'

type AccordionProps = {
  items: {
    question: string
    answer: string
  }[]
}

export default function Accordion({ items }: AccordionProps) {
  return (
    <div className="accordion-wrapper">
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
