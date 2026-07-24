import { t, type Dictionary } from "intlayer";

const faqPiercing2Content = {
  key: "faq-piercing2",
  content: {
    items: [
      {
        question: t({
          lt: "Ar kaina apima papuošalą, ar jis perkamas atskirai?",
          en: "Does the price include the jewelry, or is it purchased separately?",
        }),
        answer: t({
          lt: "Į vėrimo kainą įskaičiuotas titaninis strypelis arba barbell’is, bei standartinis burbuliukas.",
          en: "The piercing price includes a titanium bar or barbell, as well as a standard ball.",
        }),
      },
      {
        question: t({
          lt: "Ar reikalingas avansas rezervacijai? Ar jis grąžinamas?",
          en: "Is a deposit required for booking? Is it refundable?",
        }),
        answer: t({
          lt: "Rezervacijai reikalingas 10€ avansas, kuris įsiskaičiuoja į vėrimo kainą (t. y., sumokate 10€ avansą už auskaro vėrimą, kuris kainuoja 30€, vadinasi, studijoje sumokėsite likusius 20€). Stipriai vėluojant arba neatvykus į vizitą, avansas negrąžinamas. Pranešus apie neatvykimą bent 12 val. iš anksto, avansas grąžinamas.",
          en: "A €10 deposit is required for booking, which is deducted from the piercing price (i.e., you pay a €10 deposit for a piercing that costs €30, so you'll pay the remaining €20 at the studio). If you are significantly late or fail to show up for your appointment, the deposit is non-refundable. If you notify at least 12 hours in advance that you won't be attending, the deposit is refunded.",
        }),
      },
      {
        question: t({
          lt: "Iki kada galiu atšaukti arba perkelti apsilankymą?",
          en: "Until when can I cancel or reschedule my appointment?",
        }),
        answer: t({
          lt: "Atšaukti arba perkelti apsilankymą galima iki 12 valandų iki vizito laiko.",
          en: "You can cancel or reschedule your appointment up to 12 hours before the appointment time.",
        }),
      },
      {
        question: t({
          lt: "Kokius mokėjimo būdus priimate?",
          en: "What payment methods do you accept?",
        }),
        answer: t({
          lt: "Priimu mokėjimus grynais arba bankiniu pavedimu.",
          en: "I accept payments in cash or by bank transfer.",
        }),
      },
      {
        question: t({
          lt: "Kada nesidaryti piercing’o?",
          en: "When should you not get a piercing?",
        }),
        answer: t({
          lt: "Piercing’o nerekomenduojama darytis susilpnėjus imunitetui, sergant lėtinėmis ligomis, moterims besilaukiant kūdikio ir žindant.",
          en: "Getting a piercing is not recommended if your immune system is weakened, if you have chronic illnesses, or for women who are pregnant or breastfeeding.",
        }),
      },
    ],
  },
} satisfies Dictionary;

export default faqPiercing2Content;
