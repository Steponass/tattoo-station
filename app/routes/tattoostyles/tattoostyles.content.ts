import { t, type Dictionary } from "intlayer";
import type { ArtistStyle } from "~/lib/artists/artistStyles";

const tattoostylesContent = {
  key: "tattoostyles",
  content: {
    title: t({
      lt: "Tatuiruočių stiliai",
      en: "Tattoo Styles",
    }),
    description: t({
      lt: "Susipažinkite su tatuiruočių stiliais, kuriuos atliekame studijoje",
      en: "Explore the tattoo styles we work in at the studio",
    }),
    styles: [
      {
        styleKey: "Realism" as ArtistStyle,
        heading: t({
          lt: "Realizmas",
          en: "Realism",
        }),
        description: t({
          lt: "Realizmo tatuiruotės siekia atrodyti kaip nuotraukos ant odos, pabrėžiant detales, šviesą ir gylį. Puikiai tinka portretams, gyvūnams ar realistiškiems objektams.",
          en: "Realism tattoos are made to look like photographs on skin, focusing on detail, light, and depth. Perfect for portraits, animals, or lifelike objects.",
        }),
      },
      {
        styleKey: "Traditional" as ArtistStyle,
        heading: t({
          lt: "Traditional",
          en: "Traditional",
        }),
        description: t({
          lt: "Laiko patikrintas stilius su ryškiomis linijomis ir ribota spalvų palete. Sukurtas išlikti aiškus ilgus metus.",
          en: "A timeless style with strong lines and limited colors. Built to last and stay clear over time.",
        }),
      },
  //     {
  //       styleKey: "Neo-traditional" as ArtistStyle,
  //       heading: t({
  //         lt: "Neo-traditional",
  //         en: "Neo-traditional",
  //       }),
  //       description: t({
  //         lt: "Šis stilius derina ryškias linijas su modernia iliustracija, kurdamas išraiškingus ir sodrius dizainus.",
  //         en: "This style pairs bold linework with modern illustration, creating expressive and richly saturated designs.",
  //   })
  // },
      {
        styleKey: "Fine line" as ArtistStyle,
        heading: t({
          lt: "Fine Line",
          en: "Fine Line",
        }),
        description: t({
          lt: "Lengvas, tikslus ir minimalus stilius, ypač tinkantis detaliems darbams.",
          en: "Light, precise, and minimal — ideal for small or detailed designs.",
        }),
      },
      {
        styleKey: "Watercolor" as ArtistStyle,
        heading: t({
          lt: "Watercolor",
          en: "Watercolor",
        }),
        description: t({
          lt: "Ryškus, sklandus ir tapybiškas stilius, puikiai tinkantis abstraktiems ar subtiliems dizainams.",
          en: "Bright, fluid, and painterly. Perfect for abstract or delicate designs.",
        }),
      },
      {
        styleKey: "Black & grey" as ArtistStyle,
        heading: t({
          lt: "Black & grey",
          en: "Black & grey",
        }),
        description: t({
          lt: "Sklandūs perėjimai nuo tamsaus iki šviesaus sukuria gylį be spalvų. Švarus ir elegantiškas pasirinkimas.",
          en: "With smooth transitions from dark to light, Black & Grey tattoos create depth without color. A clean and elegant choice.",
        }),
      },
      {
        styleKey: "Abstract" as ArtistStyle,
        heading: t({
          lt: "Abstract",
          en: "Abstract",
        }),
        description: t({
          lt: "Abstrakčios tatuiruotės laužo taisykles: jungia skirtingus elementus, stilius ir idėjas į visiškai asmenišką, unikalų rezultatą.",
          en: "Abstract tattoos break the rules: mixing elements, styles, and ideas into something completely personal and one-of-a-kind.",
        }),
      },
      {
        styleKey: "Geometric" as ArtistStyle,
        heading: t({
          lt: "Geometric",
          en: "Geometric",
        }),
        description: t({
          lt: "Švarios linijos ir struktūruoti dizainai, įkvėpti matematikos, gamtos ir simetrijos.",
          en: "Clean lines and structured designs inspired by math, nature, and symmetry.",
        }),
      },
      {
        styleKey: "Blackwork" as ArtistStyle,
        heading: t({
          lt: "Blackwork",
          en: "Blackwork",
        }),
        description: t({
          lt: "Stilius, paremtas dideliais juodais plotais ir stipriomis formomis. Paprastas, bet įspūdingas.",
          en: "This style focuses on heavy black areas and powerful shapes. Simple but impactful.",
        }),
      },
      {
        styleKey: "Minimalist" as ArtistStyle,
        heading: t({
          lt: "Minimalism",
          en: "Minimalism",
        }),
        description: t({
          lt: "Paprastas, tylus ir elegantiškas stilius subtiliems pasirinkimams.",
          en: "Simple, quiet, and elegant — ideal for understated tattoos.",
        }),
      },
      {
        styleKey: "Dotwork" as ArtistStyle,
        heading: t({
          lt: "Dotwork",
          en: "Dotwork",
        }),
        description: t({
          lt: "Ši technika leidžia sukurti švelnius perėjimus ir tekstūrišką vaizdą. Dažnai naudojamas geometriniuose ar dvasiniuose dizainuose.",
          en: "This technique creates soft gradients and textured designs with a unique look. Often used in geometric or spiritual designs.",
        }),
      },
      {
        styleKey: "Illustrative" as ArtistStyle,
        heading: t({
          lt: "Illustrative",
          en: "Illustrative",
        }),
        description: t({
          lt: "Iliustracinės tatuiruotės primena piešinius ar meno kūrinius ant odos.",
          en: "Illustrative tattoos look like drawings or artwork brought to life on skin.",
        }),
      },
      // {
      //   styleKey: "Japanese" as ArtistStyle,
      //   heading: t({
      //     lt: "Japanese (Irezumi)",
      //     en: "Japanese (Irezumi)",
      //   }),
      //   description: t({
      //     lt: "Šios tatuiruotės pritaikomos prie kūno formos ir pasakoja istoriją per tradicinius simbolius.",
      //     en: "Designed to follow the body’s shape, these tattoos tell a story through traditional imagery.",
      //   }),
      // },
      {
        styleKey: "Surrealism" as ArtistStyle,
        heading: t({
          lt: "Surrealism",
          en: "Surrealism",
        }),
        description: t({
          lt: "Netikėti deriniai ir simbolika daro kiekvieną tatuiruotę išskirtinę.",
          en: "Unexpected combinations and symbolic imagery make each piece unique.",
        }),
      },
    ],
  },
} satisfies Dictionary;

export default tattoostylesContent;
