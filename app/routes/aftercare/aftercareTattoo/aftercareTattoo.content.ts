import { t, type Dictionary } from "intlayer";

const aftercaretattooContent = {
  key: "aftercareTattoo",
  content: {
    title: t({
      lt: "Tattoo Aftercare",
      en: "Tattoo Aftercare",
    }),
    description: t({
      lt: "Sužinokite, kaip tinkamai prižiūrėti šviežią tatuiruotę – valymą, kremavimą, apsaugą nuo saulės ir kas yra normalu gyjant.",
      en: "Learn how to properly care for a fresh tattoo — cleaning, creaming, sun protection, and what's normal during healing.",
    }),
    pageHeading: t({
      lt: "Tattoo Aftercare",
      en: "Tattoo Aftercare",
    }),
    introHeading: t({
      lt: "Tatuiruotės priežiūra po seanso",
      en: "Caring for your tattoo after the session",
    }),
    introPara: t({
      lt: "Tatuiruotė po seanso yra šviežiai pažeista oda, todėl pirmomis savaitėmis jai reikia švaros, ramybės ir tinkamos priežiūros. Geras sugijimas priklauso ne tik nuo meistro darbo, bet ir nuo to, kaip tatuiruotę prižiūrėsi namuose.",
      en: "A fresh tattoo is essentially a controlled skin injury, so in the first weeks it needs cleanliness, calm, and proper care. Good healing depends not only on the artist’s work, but also on how you take care of your tattoo at home.",
    }),

    section1Heading: t({
      lt: "Iškart po seanso",
      en: "Right after the session",
    }),
    section1Para1: t({
      lt: "Baigus tatuiruotę, meistras ją nuvalys ir uždengs apsaugine plėvele. Jos paskirtis – apsaugoti šviežią tatuiruotę nuo nešvarumų, trinties ir išorinės aplinkos.",
      en: "Once your tattoo is finished, your artist will clean it and cover it with a protective film. Its purpose is to protect the fresh tattoo from dirt, friction, and the outside environment.",
    }),
    section1Para2: t({
      lt: "Kiek laiko laikyti plėvelę, priklauso nuo to, kokia plėvelė buvo naudojama. Todėl šiuo atveju visada vadovaukis savo meistro duotomis instrukcijomis.",
      en: "How long you should keep the film on depends on the type used, so always follow your artist’s specific instructions.",
    }),

    section2Heading: t({
      lt: "Nuėmus plėvelę",
      en: "After removing the film",
    }),
    section2Para1: t({
      lt: "Prieš liesdamas tatuiruotę gerai nusiplauk rankas.",
      en: "Wash your hands thoroughly before touching your tattoo.",
    }),
    section2Para2: t({
      lt: "Nuėmęs plėvelę tatuiruotę švelniai nuplauk drungnu vandeniu ir švelniu, bekvapiu muilu. Nenaudok kempinių ar šveitiklių ir stipriai netrink odos.",
      en: "Gently wash the tattoo with lukewarm water and a mild, fragrance-free soap. Do not use sponges or scrubs, and avoid rubbing the skin.",
    }),
    section2Para3: t({
      lt: "Po plovimo tatuiruotę atsargiai nusausink švariu vienkartiniu popieriniu rankšluosčiu – netrink, tiesiog lengvai tapšnok. Tada leisk odai šiek tiek natūraliai nudžiūti.",
      en: "After washing, carefully pat the tattoo dry with a clean disposable paper towel — don’t rub it. Let it air dry for a few minutes.",
    }),

    section3Heading: t({
      lt: "Pirmosios dienos",
      en: "The first days",
    }),
    section3Para1: t({
      lt: "Pirmomis dienomis tatuiruotė gali būti paraudusi, jautri ar šiek tiek patinusi. Taip pat gali išsiskirti nedidelis kiekis skaidraus skysčio, plazmos ar dažų likučių. Tai įprasta šviežios tatuiruotės gijimo pradžia.",
      en: "During the first few days, your tattoo may be red, sensitive, or slightly swollen. You may also notice small amounts of clear fluid, plasma, or excess ink — this is a normal part of the early healing process.",
    }),
    section3Para2: t({
      lt: "Tatuiruotę laikyk švarią ir liesk tik švariomis rankomis. Be reikalo jos neliesk ir neleisk liesti kitiems.",
      en: "Keep the tattoo clean and only touch it with clean hands. Avoid touching it unnecessarily and don’t let others touch it.",
    }),

    section4Heading: t({
      lt: "Kremo naudojimas",
      en: "Using cream",
    }),
    section4Para1: t({
      lt: "Kai pradedi naudoti priežiūros kremą, tepk tik labai ploną sluoksnį. Oda turi būti lengvai sudrėkinta, o ne padengta storu kremo sluoksniu.",
      en: "When you start applying aftercare cream, use only a very thin layer. The skin should feel lightly moisturized, not covered in a thick layer.",
    }),
    section4Para2: t({
      lt: "Naudok tatuiruotėms tinkamą arba meistro rekomenduotą produktą.",
      en: "Use a product suitable for tattoos or one recommended by your artist.",
    }),
    section4Para3: t({
      lt: "Daugiau kremo nereiškia greitesnio ar geresnio gijimo. Per storas sluoksnis gali laikyti per daug drėgmės ir dirginti odą.",
      en: "More cream does not mean faster or better healing. Applying too much can trap moisture and irritate the skin.",
    }),

    section5Heading: t({
      lt: "Kai tatuiruotė pradeda luptis",
      en: "When the tattoo starts peeling",
    }),
    section5Para1: t({
      lt: "Po kelių dienų tatuiruotė gali pradėti sausėti, niežėti ir luptis. Tai normali gijimo dalis.",
      en: "After a few days, your tattoo may become dry, itchy, and start to peel. This is a normal part of healing.",
    }),
    section5Para2: t({
      lt: "Nelupk odos ir nekasyk tatuiruotės, net jei labai norisi. Leisk viskam pasišalinti natūraliai. Per anksti nulupus besigydančią odą galima ją pažeisti ir kartu prarasti dalį pigmento.",
      en: "Do not pick, scratch, or peel the skin — even if it’s tempting. Let everything come off naturally. Removing healing skin too early can damage the tattoo and cause pigment loss.",
    }),

    section6Heading: t({
      lt: "Drabužiai ir miegas",
      en: "Clothing and sleep",
    }),
    section6Para1: t({
      lt: "Pirmomis dienomis rinkis švarius, laisvesnius drabužius, kurie nespaudžia ir netrina tatuiruotės.",
      en: "Wear clean, loose-fitting clothes during the first days to avoid pressure and friction.",
    }),
    section6Para2: t({
      lt: "Stenkis nemiegoti tiesiai ant šviežios tatuiruotės, ypač pirmomis dienomis. Taip sumažinsi trintį ir papildomą odos dirginimą.",
      en: "Try not to sleep directly on your fresh tattoo, especially in the beginning. This helps reduce irritation and friction.",
    }),
    section6Para3: t({
      lt: "Taip pat pasirūpink švaria patalyne.",
      en: "Also make sure your bedding is clean.",
    }),

    section7Heading: t({
      lt: "Dušas ir vanduo",
      en: "Showering and water",
    }),
    section7Para1: t({
      lt: "Praustis duše galima, tačiau tatuiruotės nereikia ilgai mirkyti. Vanduo turėtų būti maloniai šiltas, ne labai karštas.",
      en: "You can shower, but avoid soaking the tattoo. Use comfortably warm water — not hot.",
    }),
    section7Para2: t({
      lt: "Kol tatuiruotė gyja, venk vonios, baseino, ežero, jūros ir kitų vietų, kur tatuiruotė būtų ilgai mirkoma vandenyje.",
      en: "While your tattoo is healing, avoid baths, pools, lakes, the sea, or any situation where it would be submerged for long periods.",
    }),
    section7Para3: t({
      lt: "Prie jų grįžk tik tada, kai oda bus pilnai sugijusi.",
      en: "Return to these only once the tattoo is fully healed.",
    }),

    section8Heading: t({
      lt: "Pirtis ir sauna",
      en: "Sauna and steam rooms",
    }),
    section8Para1: t({
      lt: "Pirties ir saunos gijimo metu taip pat reikėtų vengti. Karštis, prakaitas ir didelė drėgmė nėra tai, ko reikia šviežiai tatuiruotei.",
      en: "Avoid saunas and steam rooms during healing. Heat, sweat, and high humidity are not ideal for a fresh tattoo.",
    }),
    section8Para2: t({
      lt: "Palauk, kol tatuiruotė pilnai sugis.",
      en: "Wait until your tattoo has fully healed.",
    }),

    section9Heading: t({
      lt: "Sportas",
      en: "Exercise",
    }),
    section9Para1: t({
      lt: "Kol tatuiruotė gyja, sportuoti nerekomenduojame. Intensyviai sportuojant oda prakaituoja, tempiasi ir trinasi į drabužius ar sporto įrangą.",
      en: "We don’t recommend intense exercise while your tattoo is healing. Physical activity causes sweating, stretching, and friction against clothing or equipment.",
    }),
    section9Para2: t({
      lt: "Duok tatuiruotei ramiai sugyti, o į sportą grįžk tada, kai tatuiruota vieta bus sugijusi.",
      en: "Give your tattoo time to heal, and return to workouts once the area has recovered.",
    }),

    section10Heading: t({
      lt: "Saulė",
      en: "Sun exposure",
    }),
    section10Para1: t({
      lt: "Šviežios tatuiruotės nelaikyk tiesioginėje saulėje ir nesidegink.",
      en: "Keep your fresh tattoo out of direct sunlight and avoid tanning.",
    }),
    section10Para2: t({
      lt: "Ant dar gyjančios tatuiruotės nenaudok SPF kaip būdo „apeiti“ šią taisyklę – kol oda gyja, geriausia ją nuo saulės apsaugoti drabužiais ir tiesioginio deginimosi vengti.",
      en: "Do not use SPF as a workaround while the tattoo is still healing — it’s best to protect it with clothing and avoid direct sun exposure altogether.",
    }),
    section10Para3: t({
      lt: "Kai tatuiruotė visiškai sugis, naudok SPF 50, kai ji bus atidengta saulėje.",
      en: "Once fully healed, use SPF 50 when the tattoo is exposed to sunlight.",
    }),
    section10Para4: t({
      lt: "Tai verta daryti ne tik pirmą vasarą. UV spinduliai ilgainiui blukina pigmentą, todėl apsauga nuo saulės padės tatuiruotei ilgiau išlikti ryškiai ir kontrastingai.",
      en: "This isn’t just for the first summer — UV rays fade pigment over time, so sun protection helps your tattoo stay bold and vibrant longer.",
    }),

    section11Heading: t({
      lt: "Kiek laiko tatuiruotė gyja?",
      en: "How long does healing take?",
    }),
    section11Para1: t({
      lt: "Paviršinis odos sluoksnis dažniausiai atrodo sugijęs maždaug per 2–3 savaites, tačiau gilesniems odos sluoksniams atsistatyti reikia ilgiau.",
      en: "The outer layer of skin usually appears healed within 2–3 weeks, but deeper layers take longer to recover.",
    }),
    section11Para2: t({
      lt: "Visas gijimo procesas dažniausiai užtrunka apie 4–6 savaites, kartais ir ilgiau. Gijimo laikas priklauso nuo tatuiruotės dydžio, vietos, atlikto darbo ir tavo odos.",
      en: "The full healing process typically takes around 4–6 weeks, sometimes longer. Healing time depends on the tattoo’s size, placement, the work done, and your skin.",
    }),
    section11Para3: t({
      lt: "Net jei po savaitės ar dviejų tatuiruotė jau atrodo gražiai, tai dar nebūtinai reiškia, kad oda visiškai sugijo.",
      en: "Even if your tattoo looks fine after a week or two, it doesn’t necessarily mean it’s fully healed.",
    }),

    section12Heading: t({
      lt: "Kas gijimo metu yra normalu?",
      en: "What is normal during healing?",
    }),
    section12Para1: t({
      lt: "Nedidelis paraudimas, jautrumas ar patinimas pirmomis dienomis, vėliau atsirandantis sausumas, niežėjimas ir odos lupimasis dažniausiai yra normali gijimo proceso dalis.",
      en: "Mild redness, sensitivity, or swelling in the first days, followed by dryness, itching, and peeling, are all normal parts of the healing process.",
    }),
    section12Para2: t({
      lt: "Svarbiausia stebėti, ar situacija palaipsniui gerėja, o ne blogėja.",
      en: "The key is that things should gradually improve, not get worse.",
    }),
    section12Para3: t({
      lt: "Jei paraudimas pradeda plisti, vieta tampa vis karštesnė ar labiau patinusi, skausmas stiprėja, atsiranda pūlių, nemalonus kvapas, karščiavimas ar kiti nerimą keliantys simptomai, nelauk – kreipkis į gydytoją.",
      en: "If redness spreads, the area becomes increasingly hot or swollen, pain intensifies, or you notice pus, an unpleasant smell, fever, or other concerning symptoms — don’t wait, seek medical attention.",
    }),
    section12Para4: t({
      lt: "Jeigu tiesiog nežinai, ar tai, ką matai, yra normalu, gali parašyti savo meistrui ir atsiųsti tatuiruotės nuotrauką.",
      en: "If you’re unsure whether what you’re seeing is normal, you can always contact your artist and send a photo of your tattoo.",
    }),

    section13Heading: t({
      lt: "Ir svarbiausia",
      en: "And most importantly",
    }),
    section13Para1: t({
      lt: "Kiekviena oda gyja šiek tiek kitaip. Neperkrauk tatuiruotės įvairiais produktais, nekrapštyk jos ir nebandyk pagreitinti gijimo.",
      en: "Every body heals a little differently. Don’t overload your tattoo with products, don’t pick at it, and don’t try to rush the healing process.",
    }),
    section13Para2: t({
      lt: "Švara, plonas priežiūros priemonės sluoksnis, kuo mažiau dirginimo ir šiek tiek kantrybės – dažniausiai būtent to tatuiruotei ir reikia.",
      en: "Cleanliness, a thin layer of aftercare product, minimal irritation, and a bit of patience — that’s usually all your tattoo needs.",
    }),
  },
} satisfies Dictionary;

export default aftercaretattooContent;
