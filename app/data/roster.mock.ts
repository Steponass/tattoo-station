import type { RosterArtist, RosterPreviewPhoto } from "./roster.types";

const PLACEHOLDER_IMAGE_URL = "/IMG_4912.webp";
const PREVIEW_PHOTOS_PER_ARTIST = 6;

function buildMockPreviewPhotos(artistId: string): RosterPreviewPhoto[] {
  return Array.from({ length: PREVIEW_PHOTOS_PER_ARTIST }, (_, photoIndex) => ({
    id: `${artistId}-preview-${photoIndex + 1}`,
    url: PLACEHOLDER_IMAGE_URL,
    alt: "",
    width: 400,
    height: 400,
  }));
}

const MOCK_ARTIST_SEEDS = [
  {
    slug: "jonas",
    name: "Jonas",
    styles: ["Blackwork", "Fine line"],
    bio: {
      lt: "Specializuojasi ryškiame blackwork stiliuje ir subtiliuose, gamtos įkvėptuose fine-line darbuose.",
      en: "Specializes in bold blackwork and intricate fine-line designs inspired by nature.",
    },
    bioExcerpt: {
      lt: "Specializuojasi ryškiame blackwork stiliuje ir subtiliuose, gamtos įkvėptuose fine-line darbuose.",
      en: "Specializes in bold blackwork and intricate fine-line designs inspired by nature.",
    },
  },
  {
    slug: "gabriele",
    name: "Gabrielė",
    styles: ["Neo-traditional", "Color"],
    bio: {
      lt: "Sujungia ryškias spalvas ir neo-tradicinius motyvus drąsiuose, istorijas pasakojančiuose darbuose.",
      en: "Brings vivid color and neo-traditional motifs together in bold, storytelling pieces.",
    },
    bioExcerpt: {
      lt: "Sujungia ryškias spalvas ir neo-tradicinius motyvus drąsiuose, istorijas pasakojančiuose darbuose.",
      en: "Brings vivid color and neo-traditional motifs together in bold, storytelling pieces.",
    },
  },
  {
    slug: "steponavicius",
    name: "Steponavičius",
    styles: ["Realism", "Portrait"],
    bio: {
      lt: "Kuria fotorealistiškus portretus ir detalius juodai-pilkus šešėliavimo darbus.",
      en: "Focuses on photorealistic portraits and detailed black-and-grey shading work.",
    },
    bioExcerpt: {
      lt: "Kuria fotorealistiškus portretus ir detalius juodai-pilkus šešėliavimo darbus.",
      en: "Focuses on photorealistic portraits and detailed black-and-grey shading work.",
    },
  },
  {
    slug: "aiste",
    name: "Aistė",
    styles: ["Minimalist", "Fine line"],
    bio: {
      lt: "Kuria švelnius, minimalistinius linijinius darbus klientams, ieškantiems subtilaus detalumo.",
      en: "Creates delicate, minimalist linework for clients seeking subtle detail.",
    },
    bioExcerpt: {
      lt: "Kuria švelnius, minimalistinius linijinius darbus klientams, ieškantiems subtilaus detalumo.",
      en: "Creates delicate, minimalist linework for clients seeking subtle detail.",
    },
  },
  {
    slug: "tomas",
    name: "Tomas",
    styles: ["Japanese", "Blackwork"],
    bio: {
      lt: "Remiasi tradiciniais japonų motyvais, perkurtais per modernaus blackwork prizmę.",
      en: "Draws on traditional Japanese imagery, reworked through a modern blackwork lens.",
    },
    bioExcerpt: {
      lt: "Remiasi tradiciniais japonų motyvais, perkurtais per modernaus blackwork prizmę.",
      en: "Draws on traditional Japanese imagery, reworked through a modern blackwork lens.",
    },
  },
  {
    slug: "egle",
    name: "Eglė",
    styles: ["Watercolor", "Abstract"],
    bio: {
      lt: "Piešia laisvus, akvarele įkvėptus abstrakčius darbus su švelniais gradientais.",
      en: "Paints freeform, watercolor-inspired abstract pieces with soft gradients.",
    },
    bioExcerpt: {
      lt: "Piešia laisvus, akvarele įkvėptus abstrakčius darbus su švelniais gradientais.",
      en: "Paints freeform, watercolor-inspired abstract pieces with soft gradients.",
    },
  },
  {
    slug: "bimbalas",
    name: "Čiumbalas",
    styles: ["Piss", "Scat"],
    bio: {
      lt: "Get dirty fast",
      en: "Get dirty fast",
    },
    bioExcerpt: {
      lt: "Get dirty fast",
      en: "Get dirty fast",
    },
  },
  {
    slug: "joana",
    name: "Agnė Joana",
    styles: [],
    bio: {
      lt: "Mano piercing’o kelionė prasidėjo dar paauglystėje - pradėjau nuo auskarų vėrimo sau pačiai, tada draugams, o galų gale tai išaugo iki darbo studijoje. Labiausiai šiame man patinka matyti žmonių šypsenas pamačius rezultatą, ir girdėti žodžius “tikrai neskaudėjo taip, kaip tikėjausi”. Tai mane džiugina ir motyvuoja.\n\nVadinu save chameleonu, nes dirbant tikrai galiu prisitaikyti prie kiekvieno žmogaus ir atsižvelgti į jo poreikius tuo metu - galiu užhype’int, arba kaip tik nuramint, plepėti visą laiką ar susikaupus patylėti, apkabinti arba duoti erdvės pabūt su savimi ir pakvėpuoti.\n\nRenkantis tikslią vėrimo vietą atsižvelgiu į du dalykus: estetiką ir anatomiją. Man svarbu ne tik, kad auskaras gražiai atrodytų ir puoštų, bet kad prisitaikytų prie kiekvieno žmogaus kūno linijų ir sklandžiai gytų.\n\nKolekcionuoju tatuiruotes ir atvirukus, auginu pačią mieliausią katę pasaulyje, klausau daug ir įvairios muzikos.",
      en: "My piercing journey started back in my teenage years - I began by piercing my own ears, then my friends', and eventually it grew into working at a studio. What I love most is seeing people's smiles when they see the result, and hearing them say \"that really didn't hurt as much as I expected.\" That's what makes me happy and keeps me motivated.\n\nI call myself a chameleon, because when I work I can genuinely adapt to each person and meet their needs in the moment - I can hype someone up, or just as easily calm them down, chat the whole time or sit quietly with them if they're focused, give a hug or simply give them space to be with themselves and breathe.\n\nWhen choosing the exact placement of a piercing, I consider two things: aesthetics and anatomy. It matters to me not just that the piece looks beautiful and flattering, but that it suits the lines of each person's body and heals smoothly.\n\nI collect tattoos and postcards, I'm raising the sweetest cat in the world, and I listen to a lot of varied music.",
    },
    bioExcerpt: {
      lt: "Ilgametė patirtis, profesionalus darbas, šiltas bendravimas ir empatija – mano vizitinė kortelė.",
      en: "Years of experience, professional work, warm communication, and empathy - that's my calling card.",
    },
  },
] as const;

export const mockRosterArtists: RosterArtist[] = MOCK_ARTIST_SEEDS.map(
  (seed, seedIndex) => {
    const id = `mock-artist-${seedIndex + 1}`;

    return {
      id,
      slug: seed.slug,
      name: seed.name,
      styles: [...seed.styles],
      bio: seed.bio,
      bioExcerpt: seed.bioExcerpt,
      avatar: {
        id: `${id}-avatar`,
        url: PLACEHOLDER_IMAGE_URL,
        alt: seed.name,
        width: 96,
        height: 96,
      },
      previewPhotos: buildMockPreviewPhotos(id),
    };
  },
);
