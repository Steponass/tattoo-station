import type {
  BudgetRange,
  ServiceCategory,
  TattooStyle,
} from "./bookingConstants";

export type FieldErrorCode =
  | "required"
  | "too_short"
  | "too_long"
  | "invalid_email"
  | "invalid_phone"
  | "invalid_url"
  | "invalid_option"
  | "invalid_number"
  | "number_out_of_range"
  | "too_many_photos";

/** Field name to error code. Resolved to localized text in the browser. */
export type BookingFieldErrorCodes = Partial<Record<string, FieldErrorCode>>;

export type ArtistSelection =
  | { kind: "specific"; artistId: number }
  | { kind: "not_specified" };

type CommonBookingFields = {
  draftId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  artistSelection: ArtistSelection;
  preferredTimes?: string;
  description: string;
  referenceLink?: string;
  photoKeys: string[];
  isFirstTime: boolean;
  marketingConsent: boolean;
};

export type TattooBookingSubmission = CommonBookingFields & {
  serviceCategory: "tattoo";
  serviceType: string;
  bodyPlacement: string;
  preferredStyle?: TattooStyle;
  approxSizeCm?: string;
  budgetRange?: BudgetRange;
};

export type PiercingBookingSubmission = CommonBookingFields & {
  serviceCategory: "piercing";
  serviceType: string;
  bodyPlacement: string;
};

export type OtherBookingSubmission = CommonBookingFields & {
  serviceCategory: "other";
  serviceType: null;
};

/**
 * A validated booking, discriminated by service category so that fields which
 * apply only to tattoos are unreachable on the other branches.
 */
export type BookingSubmission =
  | TattooBookingSubmission
  | PiercingBookingSubmission
  | OtherBookingSubmission;

export type BookingValidationResult =
  | { valid: true; submission: BookingSubmission }
  | { valid: false; fieldErrors: BookingFieldErrorCodes };

/** Field-level validation errors resolved to display text, keyed by field name. */
export type BookingFieldErrors = Partial<Record<string, string>>;

export const FIELD_MAX_LENGTHS = {
  customerName: 120,
  customerEmail: 254,
  customerPhone: 32,
  preferredTimes: 300,
  description: 2000,
  bodyPlacement: 120,
  referenceLink: 500,
  approxSizeCm: 60,
} as const satisfies Record<string, number>;

/**
 * Floors for fields where a technically non-empty answer still tells us
 * nothing. Everything else only needs to be present.
 */
export const FIELD_MIN_LENGTHS = {
  description: 5,
} as const satisfies Record<string, number>;

export const APPROX_SIZE_CM_RANGE = { minimum: 0.5, maximum: 200 } as const;

export function isServiceCategory(
  value: string,
): value is ServiceCategory {
  return value === "tattoo" || value === "piercing" || value === "other";
}