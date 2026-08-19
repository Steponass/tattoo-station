import { t, type Dictionary } from "intlayer";

const faqPiercing1Content = {
  key: "faq-piercing1",
  content: {
    // Rendered as an inline link appended to the first item's answer,
    // pointing to /aftercare/aftercarePiercing — see piercing.tsx.
    aftercareLinkLabel: t({
      lt: "čia",
      en: "here",
    }),
    items: [
      {
        question: t({
          lt: "Kaip prižiūrėti?",
          en: "How do I take care of it?",
        }),
        answer: t({
          lt: "Priežiūros instrukcijas rasite ",
          en: "You'll find the aftercare instructions ",
        }),
      },
      {
        question: t({
          lt: "Ar galiu vietoj burbuliuko įsigyti kitą auskarą?",
          en: "Can I get a different earring instead of the ball?",
        }),
        answer: t({
          lt: "Įmanomas kitas auskarų pasirinkimas už papildomą kainą.",
          en: "A different earring option is available for an additional fee.",
        }),
      },
      {
        question: t({
          lt: "Nuo kiek metų galima vertis auskarą?",
          en: "From what age can I get a piercing?",
        }),
        answer: t({
          lt: "Ausų vėrimus atlieku nuo 7-8 metų, kai vaikas pats gali priimti šį sprendimą ir supranta, kaip vyksta procedūra ir kaip prižiūrėti gijančius auskarų vėrimus.\nVeido ir kremzlių vėrimus - nuo 14-15 metų.\nBamba - nuo 16 metų.\nKrūtų speneliai - nuo 18 metų.",
          en: "I do ear piercings from 7-8 years old, once the child can make the decision themselves and understands how the procedure works and how to care for the healing piercing.\nFacial and cartilage piercings - from 14-15 years old.\nNavel - from 16 years old.\nNipples - from 18 years old.",
        }),
      },
      {
        question: t({
          lt: "Jei aš nepilnametis, ar reikia tėvų sutikimo?",
          en: "If I'm a minor, do I need parental consent?",
        }),
        answer: t({
          lt: "Iki 16 metų būtina tėvų ar globėjų palyda.\nNuo 16 iki 18 metų būtinas raštinis tėvų sutikimas.\nNuo 18 metų sutikimo nereikia, bet galiu paprašyti asmens dokumentų, jei kyla abejonių dėl amžiaus.",
          en: "Under 16 years old, a parent or guardian must accompany you.\nFrom 16 to 18 years old, written parental consent is required.\nFrom 18 years old, no consent is needed, but I may ask for ID if there is any doubt about your age.",
        }),
      },
      {
        question: t({
          lt: "Ar vėrimas skauda? Ar priklauso nuo vietos?",
          en: "Does piercing hurt? Does it depend on the location?",
        }),
        answer: t({
          lt: "Vėrimas skauda, bet tik akimirką, visai kaip kraujo paėmimas arba skiepas. Įvairios kūno vietos turi skirtingą jautrumą, priklausomai nuo audinio standumo ir nervų galūnėlių kiekio, taip pat skausmas priklauso nuo individualaus asmens - vieni nieko nepajaučia, kiti reaguoja jautriau.",
          en: "Piercing does hurt, but only for a moment, much like a blood draw or a vaccination. Different body locations have different sensitivity, depending on tissue firmness and the number of nerve endings, and pain also depends on the individual - some feel almost nothing, while others are more sensitive.",
        }),
      },
      {
        question: t({
          lt: "Ar svarbus pirmojo auskaro metalas gijimo metu?",
          en: "Does the metal of the first earring matter during healing?",
        }),
        answer: t({
          lt: "Svarbus, dėl to veriu tik su titaniniais auskarais, kurie yra hipoalerginiai ir tinkami gijimui. Iš to paties titano gaminami ir medicininiai implantai, todėl jis visiškai saugus.",
          en: "Yes, it matters, which is why I only pierce with titanium earrings, which are hypoallergenic and suitable for healing. Medical implants are made from the same titanium, so it is completely safe.",
        }),
      },
    ],
  },
} satisfies Dictionary;

export default faqPiercing1Content;
