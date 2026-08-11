import {
  ARTIST_NOT_SPECIFIED,
  BUDGET_RANGES,
  SERVICE_TYPES_BY_CATEGORY,
  TATTOO_STYLES,
  categoryAllowsUnspecifiedArtist,
  type BudgetRange,
  type ServiceCategory,
  type TattooStyle,
} from "./bookingConstants";
import { MAX_PHOTOS_PER_BOOKING } from "./photoConstraints";
import {
  isValidEmailShape,
  isValidPhoneShape,
  readCheckbox,
  readOptionalText,
  readTextList,
} from "./formDataReaders";
import {
  APPROX_SIZE_CM_RANGE,
  FIELD_MAX_LENGTHS,
  FIELD_MIN_LENGTHS,
  isServiceCategory,
  type ArtistSelection,
  type BookingFieldErrorCodes,
  type BookingSubmission,
  type BookingValidationResult,
  type FieldErrorCode,
} from "./bookingSubmissionTypes";
import { DRAFT_ID_FIELD_NAME } from "./spamGuardConstants";

/**
 * Collects field errors while validation proceeds, so a submission reports
 * every problem at once rather than one per round trip.
 */
class FieldErrorCollector {
  private readonly errors: BookingFieldErrorCodes = {};

  record(fieldName: string, code: FieldErrorCode): void {
    // Keep the first error per field; later checks are usually consequences.
    if (this.errors[fieldName] === undefined) {
      this.errors[fieldName] = code;
    }
  }

  get hasErrors(): boolean {
    return Object.keys(this.errors).length > 0;
  }

  get collected(): BookingFieldErrorCodes {
    return this.errors;
  }
}

function readRequiredText({
  formData,
  fieldName,
  maxLength,
  errors,
}: {
  formData: FormData;
  fieldName: string;
  maxLength: number;
  errors: FieldErrorCollector;
}): string | undefined {
  const value = readOptionalText(formData, fieldName);

  if (value === undefined) {
    errors.record(fieldName, "required");
    return undefined;
  }

  if (value.length > maxLength) {
    errors.record(fieldName, "too_long");
    return undefined;
  }

  return value;
}

function readOptionalBoundedText({
  formData,
  fieldName,
  maxLength,
  errors,
}: {
  formData: FormData;
  fieldName: string;
  maxLength: number;
  errors: FieldErrorCollector;
}): string | undefined {
  const value = readOptionalText(formData, fieldName);

  if (value === undefined) {
    return undefined;
  }

  if (value.length > maxLength) {
    errors.record(fieldName, "too_long");
    return undefined;
  }

  return value;
}

function readServiceCategory({
  formData,
  errors,
}: {
  formData: FormData;
  errors: FieldErrorCollector;
}): ServiceCategory | undefined {
  const value = readOptionalText(formData, "serviceCategory");

  if (value === undefined) {
    errors.record("serviceCategory", "required");
    return undefined;
  }

  if (!isServiceCategory(value)) {
    errors.record("serviceCategory", "invalid_option");
    return undefined;
  }

  return value;
}

/**
 * The 'other' category has no subtypes, so a submitted value there is a client
 * bug rather than a user error — it is discarded rather than reported.
 */
function readServiceType({
  formData,
  serviceCategory,
  errors,
}: {
  formData: FormData;
  serviceCategory: ServiceCategory;
  errors: FieldErrorCollector;
}): string | null | undefined {
  const permittedServiceTypes: readonly string[] =
    SERVICE_TYPES_BY_CATEGORY[serviceCategory];

  if (permittedServiceTypes.length === 0) {
    return null;
  }

  const value = readOptionalText(formData, "serviceType");

  if (value === undefined) {
    errors.record("serviceType", "required");
    return undefined;
  }

  if (!permittedServiceTypes.includes(value)) {
    errors.record("serviceType", "invalid_option");
    return undefined;
  }

  return value;
}

/**
 * Resolves the artist choice into the shape the bookings table expects.
 *
 * Confirms only that the value is well formed and permitted for the category.
 * Whether the referenced artist exists and performs this service is checked in
 * the action, which has database access.
 */
function readArtistSelection({
  formData,
  serviceCategory,
  errors,
}: {
  formData: FormData;
  serviceCategory: ServiceCategory;
  errors: FieldErrorCollector;
}): ArtistSelection | undefined {
  const permittedServiceTypes: readonly string[] =
    SERVICE_TYPES_BY_CATEGORY[serviceCategory];

  // 'other' presents no artist choice; such enquiries go to the studio.
  if (permittedServiceTypes.length === 0) {
    return { kind: "not_specified" };
  }

  const value = readOptionalText(formData, "artistSelection");

  if (value === undefined) {
    errors.record("artistSelection", "required");
    return undefined;
  }

  if (value === ARTIST_NOT_SPECIFIED) {
    if (!categoryAllowsUnspecifiedArtist(serviceCategory)) {
      errors.record("artistSelection", "invalid_option");
      return undefined;
    }

    return { kind: "not_specified" };
  }

  const artistId = Number(value);

  if (!Number.isInteger(artistId) || artistId <= 0) {
    errors.record("artistSelection", "invalid_option");
    return undefined;
  }

  return { kind: "specific", artistId };
}

function readOptionFromList<TOption extends string>({
  formData,
  fieldName,
  permittedOptions,
  errors,
}: {
  formData: FormData;
  fieldName: string;
  permittedOptions: readonly { value: string }[];
  errors: FieldErrorCollector;
}): TOption | undefined {
  const value = readOptionalText(formData, fieldName);

  if (value === undefined) {
    return undefined;
  }

  const isPermitted = permittedOptions.some(
    (option) => option.value === value,
  );

  if (!isPermitted) {
    errors.record(fieldName, "invalid_option");
    return undefined;
  }

  return value as TOption;
}

function parseDecimalNumber(value: string): number | null {
  const parsedValue = Number(value);

  return Number.isFinite(parsedValue) ? parsedValue : null;
}

function readApproxSizeCm({
  formData,
  errors,
}: {
  formData: FormData;
  errors: FieldErrorCollector;
}): number | undefined {
  const rawValue = readOptionalText(formData, "approxSizeCm");

  if (rawValue === undefined) {
    return undefined;
  }

  const parsedValue = parseDecimalNumber(rawValue);

  if (parsedValue === null) {
    errors.record("approxSizeCm", "invalid_number");
    return undefined;
  }

  const { minimum, maximum } = APPROX_SIZE_CM_RANGE;

  if (parsedValue < minimum || parsedValue > maximum) {
    errors.record("approxSizeCm", "number_out_of_range");
    return undefined;
  }

  return parsedValue;
}

function readPhotoKeys({
  formData,
  errors,
}: {
  formData: FormData;
  errors: FieldErrorCollector;
}): string[] {
  const photoKeys = readTextList(formData, "photoKeys");

  if (photoKeys.length > MAX_PHOTOS_PER_BOOKING) {
    errors.record("photoKeys", "too_many_photos");
    return [];
  }

  return photoKeys;
}

/**
 * Validates a booking submission read from FormData.
 *
 * Runs in both places deliberately: the browser calls it before submitting so
 * the user sees problems without a round trip, and the action calls it again
 * because nothing arriving from a browser can be trusted. Sharing one function
 * is what keeps the two verdicts from drifting apart.
 *
 * Reports error codes rather than messages: the action runs server-side where
 * no translation context is available, and messages must be resolvable in
 * either site language.
 *
 * Does not check the spam guards, which the action evaluates before this runs,
 * and does not verify that submitted photo keys exist in storage.
 */
export function validateBookingSubmission(
  formData: FormData,
): BookingValidationResult {
  const errors = new FieldErrorCollector();

  const draftId = readOptionalText(formData, DRAFT_ID_FIELD_NAME);

  if (draftId === undefined) {
    errors.record(DRAFT_ID_FIELD_NAME, "required");
  }

  const customerName = readRequiredText({
    formData,
    fieldName: "customerName",
    maxLength: FIELD_MAX_LENGTHS.customerName,
    errors,
  });

  const customerEmail = readRequiredText({
    formData,
    fieldName: "customerEmail",
    maxLength: FIELD_MAX_LENGTHS.customerEmail,
    errors,
  });

  if (customerEmail !== undefined && !isValidEmailShape(customerEmail)) {
    errors.record("customerEmail", "invalid_email");
  }

  const customerPhone = readRequiredText({
    formData,
    fieldName: "customerPhone",
    maxLength: FIELD_MAX_LENGTHS.customerPhone,
    errors,
  });

  if (customerPhone !== undefined && !isValidPhoneShape(customerPhone)) {
    errors.record("customerPhone", "invalid_phone");
  }

  const serviceCategory = readServiceCategory({ formData, errors });

  const description = readRequiredText({
    formData,
    fieldName: "description",
    maxLength: FIELD_MAX_LENGTHS.description,
    errors,
  });

  if (
    description !== undefined &&
    description.length < FIELD_MIN_LENGTHS.description
  ) {
    errors.record("description", "too_short");
  }

  const preferredTimes = readOptionalBoundedText({
    formData,
    fieldName: "preferredTimes",
    maxLength: FIELD_MAX_LENGTHS.preferredTimes,
    errors,
  });

  const referenceLink = readOptionalBoundedText({
    formData,
    fieldName: "referenceLink",
    maxLength: FIELD_MAX_LENGTHS.referenceLink,
    errors,
  });

  const photoKeys = readPhotoKeys({ formData, errors });

  const isFirstTime = readCheckbox(formData, "isFirstTime");
  const marketingConsent = readCheckbox(formData, "marketingConsent");

  // Explicit, unticked consent to process the booking. Required by GDPR and
  // recorded with a timestamp by the action.
  if (!readCheckbox(formData, "privacyConsent")) {
    errors.record("privacyConsent", "required");
  }

  // Category-dependent fields cannot be read until the category is known.
  if (serviceCategory === undefined) {
    return { valid: false, fieldErrors: errors.collected };
  }

  const serviceType = readServiceType({ formData, serviceCategory, errors });
  const artistSelection = readArtistSelection({
    formData,
    serviceCategory,
    errors,
  });

  const bodyPlacement =
    serviceCategory === "other"
      ? undefined
      : readRequiredText({
          formData,
          fieldName: "bodyPlacement",
          maxLength: FIELD_MAX_LENGTHS.bodyPlacement,
          errors,
        });

  const preferredStyle =
    serviceCategory === "tattoo"
      ? readOptionFromList<TattooStyle>({
          formData,
          fieldName: "preferredStyle",
          permittedOptions: TATTOO_STYLES,
          errors,
        })
      : undefined;

  const budgetRange =
    serviceCategory === "tattoo"
      ? readOptionFromList<BudgetRange>({
          formData,
          fieldName: "budgetRange",
          permittedOptions: BUDGET_RANGES,
          errors,
        })
      : undefined;

  const approxSizeCm =
    serviceCategory === "tattoo"
      ? readOptionalBoundedText({
          formData,
          fieldName: "approxSizeCm",
          maxLength: FIELD_MAX_LENGTHS.approxSizeCm,
          errors,
        })
      : undefined;

  if (
    errors.hasErrors ||
    draftId === undefined ||
    customerName === undefined ||
    customerEmail === undefined ||
    customerPhone === undefined ||
    description === undefined ||
    artistSelection === undefined ||
    serviceType === undefined
  ) {
    return { valid: false, fieldErrors: errors.collected };
  }

  const commonFields = {
    draftId,
    customerName,
    customerEmail: customerEmail.toLowerCase(),
    customerPhone,
    artistSelection,
    preferredTimes,
    description,
    referenceLink,
    photoKeys,
    isFirstTime,
    marketingConsent,
  };

  if (serviceCategory === "other") {
    const submission: BookingSubmission = {
      ...commonFields,
      serviceCategory: "other",
      serviceType: null,
    };

    return { valid: true, submission };
  }

  if (bodyPlacement === undefined || serviceType === null) {
    return { valid: false, fieldErrors: errors.collected };
  }

  if (serviceCategory === "piercing") {
    const submission: BookingSubmission = {
      ...commonFields,
      serviceCategory: "piercing",
      serviceType,
      bodyPlacement,
    };

    return { valid: true, submission };
  }

  const submission: BookingSubmission = {
    ...commonFields,
    serviceCategory: "tattoo",
    serviceType,
    bodyPlacement,
    preferredStyle,
    budgetRange,
  };

  return { valid: true, submission };
}