import { t, type Dictionary } from "intlayer";

const testimonialsContent = {
  key: "Testimonials",
  content: {
    heading: t({
      lt: "Atsiliepimai",
      en: "Testimonials",
    }),
    items: [
      {
        text: t({
          lt: "Jau 4-ą kartą sugrįžtu pas meistrą Deną, kruopštus, malonus, šiltas žmogus ir puikus meistras. Tattoo studija patogioje vietoje. Studija švari ir tvarkinga. Sugrįšiu ir draugui rekomenduosiu",
          en: "This is the 4th time I've been back to the master Denas, he's a thorough, kind, warm person and a great master. Tattoo studio in a convenient location. The studio is clean and tidy. I'll be back and will recommend him to a friend :}",
        }),
        name: "Rigbys babe",
      },
      {
        text: t({
          lt: "Nuostabi ir gyvybinga vieta su labai malonia atmosfera ir meistrais!",
          en: "A wonderful and vibrant place with a very pleasant atmosphere and masters!",
        }),
        name: "Smilte Zaikauskaite",
      },
      {
        text: t({
          lt: "Ten vėriau auskarą. Nuostabus aptarnavimas! Labai malonus ir svetingas auskarų vėrėjas. Ačiū už nuostabią patirtį!",
          en: "Got pierced there. Amazing service! Very kind and welcoming piercer. Thank you for the amazing experience!",
        }),
        name: "Urte Scott",
      },
      {
        text: t({
          lt: "Tai buvo nuostabi patirtis šiame salone. Ypač patiko pati meistrė, jos šiltas priėmimas ir atliktas darbas. Esu dėkinga su besąlygine meile. Darbas nuostabus.",
          en: "It was a wonderful experience at this salon. I especially liked the master herself, her warm welcome, and the work she did. I am grateful with unconditional love. The work is amazing.",
        }),
        name: "Mi Papi",
      },
      {
        text: t({
          lt: "Turbūt geriausias tatuiruočių salonas! Puiki atmosfera, nuostabus meistras. Menininkas pasirūpins, kad gautumėte tobulą tatuiruotę, o jo darbo kokybė yra nuostabi.",
          en: "Probably the best tattoo salon out there! Great atmosphere, amazing artist. The artist will make sure you get the perfect tattoo for you and the quality of their work is amazing.",
        }),
        name: "Bby",
      },
      {
        text: t({
          lt: "Paskambinau ir susitariau dėl susitikimo kitą dieną. Labai malonūs žmonės, kurie atidžiai išklausė ir patarė, todėl tapau patenkinta kliente :)",
          en: "Called and made an appointment for the next day. Very kind people who listened carefully and gave advice which resulted in me being a happy customer :)",
        }),
        name: "Maik Henda",
      },
      {
        text: t({
          lt: "10/10 😊 Pats geriausias tattoo meistras! Kokybė, malonus bendravimas ir nereali aplinka! Visas tattoo patikėjau jam, jei dar kartą reikės, sugrįšiu tik pas ji 😊 Ačiū!!!",
          en: "10/10 😊 The best tattoo artist! Quality, pleasant communication and an unreal environment! I entrusted all my tattoos to him, if I need them again, I will only come back to her 😊 Thank you!!!",
        }),
        name: "Kristina R.",
      },
    ],
  },
} satisfies Dictionary;

export default testimonialsContent;
