import { t, type Dictionary } from "intlayer";

const faqBeforeContent = {
  key: "faq-before",
  content: {
    items: [
      {
        question: t({
          lt: "Kaip pasiruošti tatuiruotės seansui?",
          en: "How should I prepare for a tattoo session?",
        }),
        answer: t({
          lt: "Nieko sudėtingo – prieš seansą gerai išsimiegok, normaliai pavalgyk ir nepamiršk vandens. Dieną prieš venk alkoholio, o į studiją ateik su švaria oda ir patogiais drabužiais. Kuo geriau jausiesi pats, tuo lengviau praeis ir visas seansas.",
          en: "Nothing complicated: get a good night’s sleep, eat normally, and don’t forget to stay hydrated. Avoid alcohol the day before, and come to the studio with clean skin and comfortable clothing. The better you feel, the smoother the whole session will go.",
        }),
      },
      {
        question: t({
          lt: "Ar reikia registruotis iš anksto?",
          en: "Do you accept walk-ins?",
        }),
        answer: t({
          lt: "Geriausia laiką rezervuoti iš anksto – tada ramiai susiderinsime dieną, laiką ir meistrą. Bet jei sugalvojai spontaniškai, visada gali parašyti ar užsukti. Jei tuo metu turėsime laisvą vietą, mielai priimsime ir be registracijos.",
          en: "It’s best to book your appointment in advance — that way we can arrange a time, date, and artist that suits you. But if you’re feeling spontaneous, feel free to message us or drop by. If we have availability at that moment, we’ll be happy to take you without an appointment.",
        }),
      },
      {
        question: t({
          lt: "Kada nesidaryti tatuiruotės?",
          en: "When should I avoid getting a tattoo?",
        }),
        answer: t({
          lt: "Jei sergi, karščiuoji ar tiesiog jautiesi prastai – geriau palauk, kol atsigausi. Tas pats galioja, jei oda būsimoje tatuiruotės vietoje yra sudirgusi, pažeista ar nudegusi saulėje. Tatuiruotė niekur nepabėgs, o gerai savijautai ir sveikai odai sugijimas bus daug lengvesnis.",
          en: "If you’re sick, have a fever, or just aren’t feeling well, it’s best to wait until you’ve recovered. The same goes if the skin in the area you want tattooed is irritated, damaged, or sunburned. Your tattoo isn’t going anywhere — and it will heal much better when your body feels good and your skin is healthy.",
        }),
      },
      {
        question: t({
          lt: "Ar prieš rezervaciją reikalinga konsultacija? Ar ji nemokama?",
          en: "Do I need a consultation before booking? Is it free?",
        }),
        answer: t({
          lt: "Ne visada; jei idėja aiški, dažniausiai viską galime susiderinti žinutėmis. Jei planuoji didesnį ar sudėtingesnį darbą, verta užsukti į studiją ir viską aptarti gyvai su meistru. Konsultacija nieko nekainuoja.",
          en: "Not always; if your idea is clear, we can usually sort everything out over messages. If you’re planning a larger or more complex piece, it’s worth stopping by the studio to discuss it in person with your artist. Consultations are free.",
        }),
      },
      {
        question: t({
          lt: "Ar galiu atsivesti draugą ar palydovą į seansą?",
          en: "Can I bring a friend or someone with me to the session?",
        }),
        answer: t({
          lt: "Taip, vieną žmogų tikrai gali atsivesti. Tik norime, kad seanso metu meistras galėtų ramiai dirbti, todėl palydovo prašome netrukdyti darbo procesui.",
          en: "Yes! You’re welcome to bring one person with you. We just ask that your guest respects the process and doesn’t interfere, so your artist can work comfortably.",
        }),
      },
      {
        question: t({
          lt: "Ar skauda tatuiruojantis?",
          en: "Does getting a tattoo hurt?",
        }),
        answer: t({
          lt: "Taip, jausis – vis dėlto tai tatuiruotė :) Dažniausiai viskas būna daug paprasčiau, nei žmonės įsivaizduoja prieš pirmą kartą. Vienos kūno vietos jautresnės, kitos beveik neerzina, o kiekvienas skausmą jaučiame skirtingai. Jei reikės pertraukėlės, tiesiog pasakyk meistrui.",
          en: "Yes, you’ll feel it — it is a tattoo, after all :) But most of the time it’s much easier than people imagine before their first one. Some areas are more sensitive, others barely bother at all, and everyone experiences pain differently. If you need a break, just let your artist know.",
        }),
      },
    ],
  },
} satisfies Dictionary;

export default faqBeforeContent;
