/**
 * Static option data for the booking form.
 *
 * Two kinds of option appear here:
 *
 * - Service categories and types carry no label. They are translated, so their
 *   display text is resolved from the i18n content by value.
 * - Budget ranges and tattoo styles carry an English label directly, because
 *   they are not translated.
 */

export const SERVICE_CATEGORIES = ["tattoo", "piercing", "other"] as const;

export type ServiceCategory = (typeof SERVICE_CATEGORIES)[number];

export const TATTOO_SERVICE_TYPES = [
  "new",
  "cover_up",
  "touch_up",
  "consultation",
] as const;

export const PIERCING_SERVICE_TYPES = [
  "new",
  "jewelry_change",
  "consultation",
] as const;

export type ServiceType =
  | (typeof TATTOO_SERVICE_TYPES)[number]
  | (typeof PIERCING_SERVICE_TYPES)[number];

/**
 * Service types offered within each category.
 *
 * 'other' is intentionally empty: it collects enquiries that do not fit the
 * standard services, so it presents no subtype choice and no design fields
 * beyond a description.
 */
export const SERVICE_TYPES_BY_CATEGORY = {
  tattoo: TATTOO_SERVICE_TYPES,
  piercing: PIERCING_SERVICE_TYPES,
  other: [],
} as const satisfies Record<ServiceCategory, readonly ServiceType[]>;

/**
 * Artist roles eligible for each category. Used to narrow the artist dropdown.
 * 'other' enquiries are routed to the studio rather than an individual.
 */
export const ARTIST_ROLES_BY_CATEGORY = {
  tattoo: ["tattoo", "both"],
  piercing: ["piercing", "both"],
  other: [],
} as const;

/**
 * Sentinel value for "any artist". Stored as a real value on the booking row
 * rather than a null so that an unmade choice is distinguishable from a lost one.
 */
export const ARTIST_NOT_SPECIFIED = "not_specified";

/**
 * Only tattoo enquiries may be left unassigned. Piercing is a single-piercer
 * service, and 'other' always goes to the studio.
 */
export const CATEGORIES_ALLOWING_UNSPECIFIED_ARTIST: readonly ServiceCategory[] =
  ["tattoo"];

export type LabelledOption = {
  value: string;
  label: string;
};

export const BUDGET_RANGES = [
  { value: "under_100", label: "<€100" },
  { value: "100_300", label: "€100–300" },
  { value: "300_600", label: "€300–600" },
  { value: "600_1000", label: "€600–1000" },
  { value: "over_1000", label: "€1000+" },
  { value: "not_sure", label: "Not sure yet" },
] as const satisfies readonly LabelledOption[];

export type BudgetRange = (typeof BUDGET_RANGES)[number]["value"];

export const TATTOO_STYLES = [
  { value: "notsure", label: "Not sure" },
  { value: "realism", label: "Realism" },
  { value: "traditional", label: "Traditional" },
  { value: "neo_traditional", label: "Neo-Traditional" },
  { value: "fine_line", label: "Fine Line" },
  { value: "watercolor", label: "Watercolor" },
  { value: "geometric", label: "Geometric" },
  { value: "blackwork", label: "Blackwork" },
  { value: "minimalism", label: "Minimalism" },
  { value: "dotwork", label: "Dotwork" },
  { value: "illustrative", label: "Illustrative" },
  { value: "tribal", label: "Tribal" },
  { value: "new_school", label: "New School" },
  { value: "japanese_irezumi", label: "Japanese (Irezumi)" },
  { value: "surrealism", label: "Surrealism" },
] as const satisfies readonly LabelledOption[];

export type TattooStyle = (typeof TATTOO_STYLES)[number]["value"];

export const TATTOO_STYLES_PAGE_PATH = "/tattoostyles";

export function categoryAllowsUnspecifiedArtist(
  serviceCategory: ServiceCategory,
): boolean {
  return CATEGORIES_ALLOWING_UNSPECIFIED_ARTIST.includes(serviceCategory);
}