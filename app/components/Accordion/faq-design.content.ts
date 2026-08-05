import { t, type Dictionary } from "intlayer";

const faqAftercareContent = {
  key: "faq-design",
  content: {
    items: [
      {
        question: t({
          lt: "Kaip vyksta eskizo derinimas?",
          en: "How does the design process work?",
        }),
        answer: t({
          lt: "Viskas prasideda nuo tavo idėjos. Papasakok, ko norėtum, atsiųsk patinkančių pavyzdžių ar tiesiog apibūdink mintį savais žodžiais. Meistras pagal tai sukurs eskizą, pritaikytą būtent tau, pasirinktai kūno vietai ir tatuiruotės dydžiui. Jei kažkas netinka – aptariam ir pataisom.",
          en: "It all starts with your idea. Tell us what you’re after, send examples you like, or simply describe it in your own words. Based on that, your artist will create a custom design tailored to you, the chosen placement, and the size of the tattoo. If something doesn’t feel right, we’ll go over it together and make adjustments.",
        }),
      },
      {
        question: t({
          lt: "Kiek eskizo pataisymų galima atlikti prieš seansą?",
          en: "How many design revisions can be made before the session?",
        }),
        answer: t({
          lt: "Tai priklauso nuo meistro ir paties projekto. Dažniausiai galutinis eskizas paruošiamas artėjant seansui, o kai kuriais atvejais – tatuiruotės dieną. Nesijaudink, prieš pradedant darbą viską kartu peržiūrėsime ir, jei reikės, pakoreguosime.",
          en: "It depends on the artist and the project itself. Usually, the final design is prepared closer to your appointment, and sometimes even on the day of the tattoo. We’ll go through everything together before starting, and make any final adjustments if needed.",
        }),
      },
      {
        question: t({
          lt: "Ar darote dangstančias tatuiruotes (cover-up)?",
          en: "Do you do cover-up tattoos?",
        }),
        answer: t({
          lt: "Taip. Tik kiekvienas cover-up yra skirtingas, todėl pirmiausia turime pamatyti seną tatuiruotę ir įvertinti, ką galime su ja padaryti. Kartais ją galima uždengti visiškai, kartais geriausias rezultatas gaunamas ją įkomponuojant į naują dizainą. Parašyk mums ir atsiųsk aiškią tatuiruotės nuotrauką – pasakysime, kokie variantai įmanomi. ",
          en: "Yes. Every cover-up is different, so we’ll first need to see your existing tattoo and assess what’s possible. In some cases it can be fully covered, while in others the best result comes from incorporating it into a new design. Send us a message with a clear photo of your tattoo, and we’ll let you know what options are available.",
        }),
      },
      {
        question: t({
          lt: "Kaip išsirinkti tinkamą meistrą?",
          en: "How do I choose the right artist?",
        }),
        answer: t({
          lt: "Pirmiausia žiūrėk į darbus. Kiekvienas mūsų meistras turi savo braižą, mėgstamas temas ir stilius. Išsirink tą, kurio darbai tau labiausiai limpa. O jei nežinai, kas geriausiai tiktų tavo idėjai – tiesiog parašyk mums. Padėsime išsirinkti meistrą, kuriam tavo projektas tiks labiausiai.",
          en: "Start by looking at their work. Each of our artists has their own style, preferred themes, and approach. Choose the one whose work resonates with you the most. If you’re not sure who would be the best fit, just reach out — we’ll help match you with the artist who suits your project best.",
        }),
      },
      {
        question: t({
          lt: "Ar galite atlikti tikslią kito atlikėjo darbo kopiją?",
          en: "Can you copy another artist’s work exactly?",
        }),
        answer: t({
          lt: "Kito meistro darbo vienas prie vieno nekopijuojame. Nuotrauką drąsiai gali naudoti kaip pavyzdį – pagal ją sukursime savo variantą, išlaikydami patinkančią idėją, nuotaiką ar stilių. Taip tatuiruotė bus ne kažkieno darbo kopija, o tavo. ",
          en: "We don’t replicate another artist’s work one-to-one. You’re very welcome to use a reference image — we’ll create our own version inspired by what you like about it, whether it’s the idea, mood, or style. That way, your tattoo is something truly yours.",
        }),
      },
    ],
  },
} satisfies Dictionary;

export default faqAftercareContent;
