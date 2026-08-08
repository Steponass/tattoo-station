import { t, type Dictionary } from "intlayer";

const aftercarePiercingContent = {
  key: "aftercarePiercing",
  content: {
    title: t({
      lt: "Auskarų priežiūra",
      en: "Piercing aftercare",
    }),
    description: t({
      lt: "Kaip prižiūrėti šviežiai pradurtą auskarą ir burnos ertmės vėrimus.",
      en: "How to care for a fresh piercing and oral piercings.",
    }),
    aftercare1: t({
      lt: "Šviežiai pravertą auskarą reikia 2 kartus į dieną valyti su Oktisept tirpalu arba specialiu auskarams skirtu druskos tirpalu (Neilmed arba Easy Piercing). Tirpalas užpurškiamas ant vienkartinio vatos tamponėlio (arba ausų krapštuko) ir pravaloma auskaro įvėrimo vieta bei pats auskaras. Jei įvertas ilgesnis auskaras, pirma pastumiam jį į vieną pusę ir nuvalom, tada pastumiam į kitą ir irgi kruopščiai nuvalom. Labai svarbu kruopščiai nuplauti pridžiūvusias išskyras (tai yra iš žaizdos ištekėjusi limfa, kurioje gali daugintis mikroorganizmai).",
      en: "A fresh piercing must be cleaned twice a day with Octisept solution or a dedicated piercing saline solution (Neilmed or Easy Piercing). Spray the solution onto a disposable cotton pad or cotton bud and clean both the piercing site and the jewellery itself. If longer jewellery has been fitted, first slide it to one side and clean, then slide it to the other side and clean thoroughly again. It is very important to thoroughly wash away any dried discharge — this is lymph that has drained from the wound, and microorganisms can multiply in it.",
    }),
    aftercare2: t({
      lt: "Auskaro įvėrimo vieta turi būti švari, todėl pasirūpinkite, kad ant jos nepakliūtų kosmetikos (kremų, pudrų ir t.t.).",
      en: "The piercing site must stay clean, so make sure no cosmetics (creams, powders and so on) get on it.",
    }),
    aftercare3: t({
      lt: "Nesikaitinkite pirtyse, nesimaudykite baseinuose, ežeruose, upėse ir pan., kol auskaro įvėrimo vieta visiškai neužgis.",
      en: "Do not use saunas and do not swim in pools, lakes, rivers or similar until the site has fully healed.",
    }),
    aftercare4: t({
      lt: "Stenkitės be reikalo pirštais neliesti ir nejudinti auskaro.",
      en: "Try not to touch or move the jewellery with your fingers unnecessarily.",
    }),
    aftercare5: t({
      lt: "Jei teisingai prižiūrėsite auskaro įvėrimo vietą, auskaro vieta apgis per 2-4 savaites, (t. y. jau nebebus jautru, neskaudės švelniai prilietus, atslūgs tinimas ir sumažės išskyrų kiekis). Tačiau galutinai pradurta vieta sugyja daug vėliau, todėl sugijus žaizdai pradūrimo vietoje auskaru vis tiek reikia rūpintis – be reikalo neišvėrinėkite auskaro, vėrimo metu žiūrėkite, kad auskaro galas netraumuotų kanalo, plaukite auskarą, kaip nurodyta.",
      en: "With correct care the site will heal in 2–4 weeks — meaning it will no longer be tender, will not hurt on light touch, swelling will subside and discharge will reduce. However, the pierced channel itself heals much later, so even once the wound has closed the piercing still needs care: do not take the jewellery in and out unnecessarily, make sure the end of the jewellery does not injure the channel when reinserting, and keep cleaning it as instructed.",
    }),
    heading2: t({
      lt: "Burnos ertmės vėrimų priežiūra",
      en: "Oral piercing aftercare",
    }),
    aftercareA: t({
      lt: "Šviežiai įsivėrus auskarą burnos ertmėje, burną reikia skalauti Octenidol burnos skalavimo skysčiu 2 kartus per dieną po 30 sekundžių. Octenidol burnos skalavimo skystis nedažo dantų, todėl galima ir rekomenduojama išsiskalauti burną taip pat ir kiekvieną kartą po valgio bent jau tol, kol auskaro įvėrimo vieta neužgijo. Užgijus auskarui kasdieniam skalavimui rekomenduojama naudoti Esemdent mouthfresh burnos skalavimo skystį.",
      en: "With a fresh oral piercing, rinse the mouth with Octenidol mouthwash twice a day for 30 seconds. Octenidol does not stain teeth, so it can and should also be used after every meal, at least until the site has healed. Once healed, Esemdent Mouthfresh is recommended for daily rinsing.",
    }),
    aftercareB: t({
      lt: "Kol auskaro vėrimo vieta neužgijo, negalima valgyti labai karšto, aštraus maisto bei gerti labai karštų gėrimų, stipraus alkoholio.",
      en: "Until the site has healed, avoid very hot food, spicy food, very hot drinks and strong alcohol.",
    }),
    aftercareC: t({
      lt: "Liežuvio patinimą mažina šaltis: ledukai, šalti gėrimai, ledai. Tačiau per daug piktnaudžiauti šaltu maistu ir gėrimais nereiktų, nes peršalimo atveju burnoje atsiras papildoma infekcija, kuri gali turėti neigiamos įtakos pradurtos auskaro vietos gijimui.",
      en: "Cold reduces tongue swelling: ice cubes, cold drinks, ice cream. Do not overdo cold food and drink, though — catching a cold introduces additional infection in the mouth, which can affect healing.",
    }),
    aftercareD: t({
      lt: "Kol gyja šviežiai pradurta liežuvio auskaro vieta, svarbu laikytis geros burnos ertmės higienos – valykite dantis, nes ant dantų susidariusios apnašos taip pat yra terpė mikroorganizmams daugintis. Dantis valykite atsargiais lėtais judesiais. Stenktės naudoti labai švelnią dantų pastą, tačiau jei ir ji dirgina žaizdą, valykite dantis tik sudrėkintu vandenyje dantų šepetėliu. Jeigu įmanoma, reiktų nuvalyti ir apnašas nuo liežuvio.",
      en: "While a fresh tongue piercing is healing, good oral hygiene matters — brush your teeth, since plaque is also a medium in which microorganisms multiply. Brush with careful, slow movements. Try to use a very mild toothpaste; if even that irritates the wound, brush with a water-dampened toothbrush alone. If possible, clean plaque from the tongue as well.",
    }),
    aftercareE: t({
      lt: "Liežuvio patinimas praeina per 3-5 dienas, o auskaro įvėrimo vieta užgyja per maždaug dvi savaites. Kol pradurta vieta visiškai nesugijo, neišsiverkite auskaro. Jei kyla abejonių, ar viskas yra gerai, nueikite pas auskarą vėrusį meistrą, kuris jus apžiūrės ir patars. Jei auskaras yra per trumpas (pvz., jei tinimas buvo žymiai didesnis, nei paprastai) jums reikalinga meistro pagalba, nes užspaustas per trumpas auskaras blogina gijimą.",
      en: "Tongue swelling subsides within 3–5 days, and the piercing site heals in roughly two weeks. Do not remove the jewellery until the site has fully healed. If you are unsure whether something is right, go back to the piercer who did it — they will examine you and advise. If the jewellery is too short (for example if swelling was much greater than usual), you need the piercer's help, because a too-short bar being compressed worsens healing.",
    }),
  },
} satisfies Dictionary;

export default aftercarePiercingContent;
