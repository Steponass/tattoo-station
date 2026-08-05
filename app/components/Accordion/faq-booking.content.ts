import { t, type Dictionary } from "intlayer";

const faqBookingContent = {
  key: "faq-booking",
  content: {
    items: [
      {
        question: t({
          lt: "Kiek kainuoja tatuiruotė? Nuo ko priklauso kaina?",
          en: "How much does a tattoo cost? What does the price depend on?",
        }),
        answer: t({
          lt: "Vienos kainos visoms tatuiruotėms nėra; ji priklauso nuo dydžio, sudėtingumo, pasirinktos kūno vietos, detalių kiekio ir laiko, kurio reikės darbui. Atsiųsk savo idėją, norimą dydį ir kūno vietą – tada galėsime pasakyti daug tikslesnę kainą.",
          en: "The cost depends on the size, complexity, placement, level of detail, and the time needed to complete the work. Send us your idea, preferred size, and placement, and we’ll be able to give you a much more accurate estimate.",
        }),
      },
      {
        question: t({
          lt: "Ar reikalingas avansas rezervacijai? Ar jis grąžinamas?",
          en: "Is a deposit required to book? Is it refundable?",
        }),
        answer: t({
          lt: "Taip, rezervuojant laiką prašome avanso. Jis patvirtina tavo rezervaciją ir yra įskaičiuojamas į galutinę tatuiruotės kainą. Avansas reikalingas paprastai dėl vienos priežasties – rezervuotas laikas yra skirtas būtent tau, o meistras iki vizito taip pat skiria laiko pasiruošimui ir eskizui. Neatvykus ar atšaukus vizitą paskutinę minutę, avansas negrąžinamas.",
          en: "Yes, we require a deposit to secure your appointment. It confirms your booking and is deducted from the final price of your tattoo. The deposit helps ensure that the reserved time is set aside just for you, and that your artist’s preparation and design work are covered. If you don’t show up or cancel at the last minute, the deposit is non-refundable.",
        }),
      },
      {
        question: t({
          lt: "Kaip ir iki kada galiu atšaukti arba perkelti apsilankymą?",
          en: "How and when can I cancel or reschedule my appointment?",
        }),
        answer: t({
          lt: "Planai kartais keičiasi – viskas suprantama. Jei negali atvykti, tiesiog pranešk mums kuo anksčiau, geriausia bent prieš 72 valandas. Tokiu atveju rasime kitą tinkamą laiką. Atšaukus paskutinę minutę ar tiesiog neatvykus, avansas nėra grąžinamas.",
          en: "Plans change — we understand. If you can’t make it, just let us know as early as possible, ideally at least 72 hours in advance. We’ll be happy to find you another suitable time. If you cancel at the last minute or don’t show up, the deposit is non-refundable.",
        }),
      },
      {
        question: t({
          lt: "Kokius mokėjimo būdus priimate?",
          en: "What payment methods do you accept?",
        }),
        answer: t({
          lt: "Galima atsiskaityti grynaisiais arba bankiniu pavedimu. Jei dėl mokėjimo kyla klausimų, visada gali pasitikslinti prieš vizitą. ",
          en: "You can pay in cash or by bank transfer. If you have any questions about payment, feel free to check with us before your appointment.",
        }),
      },
      {
        question: t({
          lt: "Kiek laiko trunka seansas? Ar didesniems darbams reikės kelių seansų?",
          en: "How long does a session take? Will larger pieces require multiple sessions?",
        }),
        answer: t({
          lt: "Viskas priklauso nuo pačios tatuiruotės. Mažesnis darbas gali užtrukti valandą ar kelias, o didesni projektai – visą dieną ar net kelis seansus. Prieš pradedant meistras apytiksliai pasakys, kiek laiko reikėtų numatyti. Su dideliais darbais neskubame – geriau keli geri seansai nei vienas maratonas per jėgą. ",
          en: "Smaller pieces may take an hour or a few, while larger projects can last a full day or be split across multiple sessions. Before starting, your artist will give you an approximate time estimate. With bigger pieces, we don’t rush — a few well-paced sessions are always better than one exhausting marathon.",
        }),
      },
      {
        question: t({
          lt: "Ar korekcija (nublukusios vietos pataisymas) įskaičiuota į kainą?",
          en: "Are touch-ups included in the price?",
        }),
        answer: t({
          lt: "Jei tatuiruotei sugijus matome, kad kažkur reikia nedidelio pataisymo, susisiek su savo meistru ir atsiųsk nuotrauką. Jis įvertins, ar korekcija reikalinga. Natūraliai gijimo metu atsiradusius smulkius pataisymus atliekame pagal konkretaus meistro sąlygas. Jei tatuiruotė buvo netinkamai prižiūrėta ar pažeista gijimo metu, korekcija gali būti mokama. ",
          en: "If, once your tattoo has healed, it looks like a small touch-up might be needed, get in touch with your artist and send a photo. They’ll assess whether a correction is necessary. Minor touch-ups related to natural healing are handled according to each artist’s policy. If the tattoo was not properly cared for or was damaged during healing, the touch-up may be charged.",
        }),
      },
    ],
  },
} satisfies Dictionary;

export default faqBookingContent;
