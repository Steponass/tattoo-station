// app/components/booking/BookingForm.tsx

import { useReducer } from "react";
import { useIntlayer } from "react-intlayer";
import type { FetcherWithComponents } from "react-router";

import type { BookableArtist } from "~/lib/artists/artistRepository.server";
import {
  ARTIST_NOT_SPECIFIED,
  BUDGET_RANGES,
  CATEGORIES_ALLOWING_UNSPECIFIED_ARTIST,
  SERVICE_CATEGORIES,
  SERVICE_TYPES_BY_CATEGORY,
  TATTOO_STYLES,
  TATTOO_STYLES_PAGE_PATH,
  type ServiceCategory,
  type ServiceType,
} from "~/lib/booking/bookingConstants";
import {
  bookingFormReducer,
  buildInitialBookingFormState,
  type BookingFormState,
} from "~/lib/booking/bookingFormReducer";
import type {
  BookingFieldErrorCodes,
  BookingFieldErrors,
  FieldErrorCode,
} from "~/lib/booking/bookingSubmissionTypes";
import { filterArtistsForCategory } from "~/lib/booking/filterArtistsForCategory";
import type { ArtistPreselection } from "~/lib/booking/resolveArtistPreselection";
import { useBookingFormValidation } from "~/lib/booking/useBookingFormValidation";
import { usePhotoSelection } from "~/lib/booking/usePhotoSelection";
import type { PhotoEntry } from "~/lib/booking/usePhotoSelection";
import { FieldError, fieldErrorElementId } from "./FieldError";
import { PhotoUploadField } from "./photos/PhotoUploadField";
import type { PhotoStatusMessages } from "./photos/PhotoPreviewItem";
import { SpamGuardFields } from "./SpamGuardFields";
import { SubmitButton } from "./SubmitButton";
import { TurnstileWidget } from "./TurnstileWidget";
import styles from "./BookingForm.module.css";
import { LocalizedLink } from "../intlayer/LocalizedLink";

type BookingFormContent = ReturnType<typeof useIntlayer<"BookingForm">>;

/**
 * Option values are mapped to content keys rather than to display text, so the
 * wording lives entirely in BookingForm.content.ts.
 */
const SERVICE_CATEGORY_CONTENT_KEYS = {
  tattoo: "serviceCategoryTattoo",
  piercing: "serviceCategoryPiercing",
  other: "serviceCategoryOther",
} as const satisfies Record<ServiceCategory, keyof BookingFormContent>;

const SERVICE_TYPE_CONTENT_KEYS: Record<
  string,
  Record<string, keyof BookingFormContent>
> = {
  tattoo: {
    new: "tattooTypeNew",
    cover_up: "tattooTypeCoverUp",
    touch_up: "tattooTypeTouchUp",
    consultation: "tattooTypeConsultation",
  },
  piercing: {
    new: "piercingTypeNew",
    jewelry_change: "piercingTypeJewelryChange",
    consultation: "piercingTypeConsultation",
  },
};

const FIRST_TIME_CONTENT_KEYS: Record<string, keyof BookingFormContent> = {
  tattoo: "firstTimeTattoo",
  piercing: "firstTimePiercing",
};

const PHOTO_REJECTION_CONTENT_KEYS = {
  too_many_photos: "photoTooManyPhotos",
  file_too_large: "photoFileTooLarge",
  unsupported_file_type: "photoUnsupportedFileType",
} as const satisfies Record<string, keyof BookingFormContent>;

/**
 * Fallback copy for each validation code, used where the code alone already
 * says enough beside the field that produced it.
 */
const GENERIC_ERROR_CONTENT_KEYS = {
  required: "errorRequired",
  too_short: "errorTooShort",
  too_long: "errorTooLong",
  invalid_email: "errorEmailInvalid",
  invalid_phone: "errorPhoneInvalid",
  invalid_url: "errorReferenceLinkInvalid",
  invalid_option: "errorInvalidOption",
  invalid_number: "errorInvalidNumber",
  number_out_of_range: "errorNumberOutOfRange",
  too_many_photos: "errorPhotosTooMany",
} as const satisfies Record<FieldErrorCode, keyof BookingFormContent>;

/**
 * Field-specific wording, preferred over the generic message for a code.
 *
 * Mostly covers 'required', which on its own ("This field is required") says
 * less than naming what is missing.
 */
const FIELD_ERROR_CONTENT_KEYS: Partial<
  Record<string, Partial<Record<FieldErrorCode, keyof BookingFormContent>>>
> = {
  customerName: { required: "errorNameRequired" },
  customerEmail: { required: "errorEmailRequired" },
  customerPhone: { required: "errorPhoneRequired" },
  serviceCategory: { required: "errorServiceCategoryRequired" },
  serviceType: { required: "errorServiceTypeRequired" },
  artistSelection: { required: "errorArtistRequired" },
  description: {
    required: "errorDescriptionRequired",
    too_short: "errorDescriptionTooShort",
  },
  bodyPlacement: { required: "errorBodyPlacementRequired" },
  privacyConsent: { required: "errorPrivacyConsentRequired" },
};

const BODY_PLACEMENT_SUGGESTIONS_ID = "body-placement-suggestions";

const BODY_PLACEMENT_CONTENT_KEYS = [
  "placementForearm",
  "placementUpperArm",
  "placementShoulder",
  "placementChest",
  "placementBack",
  "placementRibs",
  "placementThigh",
  "placementCalf",
  "placementAnkle",
  "placementHand",
  "placementNeck",
] as const satisfies readonly (keyof BookingFormContent)[];

/**
 * True once a service type is chosen, or immediately for categories (like
 * 'other') that have no service types to choose from.
 */
function hasSelectedServiceType(formState: BookingFormState): boolean {
  if (formState.serviceCategory === null) {
    return false;
  }

  const options = SERVICE_TYPES_BY_CATEGORY[formState.serviceCategory];

  return options.length === 0 || formState.serviceType !== null;
}

/**
 * Turns validation codes into display text.
 *
 * Codes stay codes until here, which is the first point that has a translation
 * context — the validator runs in both the browser and the action, and the
 * action has no way to pick a language.
 */
function resolveFieldErrorMessages(
  fieldErrorCodes: BookingFieldErrorCodes,
  content: BookingFormContent,
): BookingFieldErrors {
  const messages: BookingFieldErrors = {};

  for (const [fieldName, code] of Object.entries(fieldErrorCodes)) {
    if (code === undefined) {
      continue;
    }

    const contentKey =
      FIELD_ERROR_CONTENT_KEYS[fieldName]?.[code] ??
      GENERIC_ERROR_CONTENT_KEYS[code];

    messages[fieldName] = content[contentKey].value;
  }

  return messages;
}

/**
 * The message under the submit button.
 *
 * A 'form' code means the submission was rejected as a whole rather than any
 * one field being wrong, so pointing at the fields would send the customer
 * looking for something that isn't there.
 */
function resolveFormErrorMessage(
  fieldErrorCodes: BookingFieldErrorCodes,
  content: BookingFormContent,
): string | undefined {
  if (fieldErrorCodes.form !== undefined) {
    return content.errorFormGeneric.value;
  }

  if (Object.keys(fieldErrorCodes).length === 0) {
    return undefined;
  }

  return content.errorFormIncomplete.value;
}

/**
 * Ties a control to its own error message, so the relationship is spelled out
 * once here rather than at all fourteen fields.
 */
function invalidFieldProps(fieldName: string, message: string | undefined) {
  return message === undefined
    ? {}
    : {
        "aria-invalid": true as const,
        "aria-describedby": fieldErrorElementId(fieldName),
      };
}

/**
 * The photo components take plain strings, so localized nodes are unwrapped
 * with `.value` at this boundary.
 */
function resolvePhotoMessages(
  entry: PhotoEntry,
  content: BookingFormContent,
): PhotoStatusMessages {
  const problemMessage =
    entry.rejectionCode === null
      ? content.photoUploadFailed.value
      : content[PHOTO_REJECTION_CONTENT_KEYS[entry.rejectionCode]].value;

  return {
    uploading: content.photoUploading.value,
    uploaded: content.photoUploaded.value,
    retryLabel: content.photoRetryLabel.value,
    removeLabel: content.photoRemoveLabel.value,
    problemMessage,
  };
}

/**
 * Absent until a category is chosen, and absent entirely for 'other', which
 * has no subtypes.
 */
function ServiceTypeField({
  serviceCategory,
  selectedValue,
  errorMessage,
  onValueChange,
  content,
}: {
  serviceCategory: ServiceCategory | null;
  selectedValue: ServiceType | null;
  errorMessage: string | undefined;
  onValueChange: (serviceType: ServiceType) => void;
  content: BookingFormContent;
}) {
  if (serviceCategory === null) {
    return null;
  }

  const options = SERVICE_TYPES_BY_CATEGORY[serviceCategory];

  if (options.length === 0) {
    return null;
  }

  return (
    <fieldset
      className={styles.radio_group}
      data-field
      data-invalid={errorMessage !== undefined || undefined}
    >
      <legend data-field-label>{content.serviceTypeLegend}</legend>

      <div
        role="radiogroup"
        data-radio-group
        {...invalidFieldProps("serviceType", errorMessage)}
      >
        {options.map((serviceType) => {
          const optionId = `serviceType-${serviceType}`;
          const contentKey =
            SERVICE_TYPE_CONTENT_KEYS[serviceCategory]?.[serviceType];
          const label =
            contentKey === undefined ? serviceType : content[contentKey];

          return (
            <div
              key={serviceType}
              data-radio-option
              data-selected={selectedValue === serviceType || undefined}
            >
              <input
                id={optionId}
                type="radio"
                name="serviceType"
                value={serviceType}
                checked={selectedValue === serviceType}
                onChange={() => onValueChange(serviceType as ServiceType)}
              />
              <label htmlFor={optionId}>{label}</label>
            </div>
          );
        })}

        <FieldError fieldName="serviceType" message={errorMessage} />
      </div>
    </fieldset>
  );
}

function ArtistField({
  serviceCategory,
  artists,
  selectedValue,
  errorMessage,
  onValueChange,
  content,
}: {
  serviceCategory: ServiceCategory | null;
  artists: readonly BookableArtist[];
  selectedValue: string | null;
  errorMessage: string | undefined;
  onValueChange: (artistSelection: string) => void;
  content: BookingFormContent;
}) {
  const eligibleArtists = filterArtistsForCategory({
    artists,
    serviceCategory,
  });

  const showNotSpecifiedOption =
    serviceCategory !== null &&
    CATEGORIES_ALLOWING_UNSPECIFIED_ARTIST.includes(serviceCategory);

  if (eligibleArtists.length === 0 && !showNotSpecifiedOption) {
    return null;
  }

  const selectId = "artistSelection";

  return (
    <div
      className={styles.field}
      data-field
      data-required
      data-invalid={errorMessage !== undefined || undefined}
    >
      <label htmlFor={selectId} data-field-label>
        {content.artistLabel}
      </label>

      <select
        id={selectId}
        name="artistSelection"
        required
        value={selectedValue ?? ""}
        onChange={(event) => onValueChange(event.currentTarget.value)}
        {...invalidFieldProps("artistSelection", errorMessage)}
      >
        <option value="" disabled>
          {content.artistPlaceholderOption}
        </option>

        {showNotSpecifiedOption && (
          <option value={ARTIST_NOT_SPECIFIED}>
            {content.artistNoPreference}
          </option>
        )}

        {eligibleArtists.map((artist) => (
          <option key={artist.id} value={String(artist.id)}>
            {artist.displayName}
          </option>
        ))}
      </select>

      <FieldError fieldName="artistSelection" message={errorMessage} />
    </div>
  );
}

/**
 * Wording depends on the service ("tattooed" vs "pierced"), so the checkbox is
 * absent until a category is chosen.
 */
function FirstTimeCheckbox({
  serviceCategory,
  content,
}: {
  serviceCategory: ServiceCategory | null;
  content: BookingFormContent;
}) {
  if (serviceCategory === null) {
    return null;
  }

  const contentKey = FIRST_TIME_CONTENT_KEYS[serviceCategory];

  if (contentKey === undefined) {
    return null;
  }

  return (
    <div className={styles.checkbox_field}>
      <input id="isFirstTime" type="checkbox" name="isFirstTime" value="on" />
      <label htmlFor="isFirstTime">{content[contentKey]}</label>
    </div>
  );
}

export function BookingForm({
  artists,
  turnstileSiteKey,
  serverFieldErrorCodes,
  fetcher,
  initialSelection,
}: {
  artists: readonly BookableArtist[];
  turnstileSiteKey: string;
  serverFieldErrorCodes: BookingFieldErrorCodes;
  fetcher: FetcherWithComponents<unknown>;
  initialSelection: ArtistPreselection;
}) {
  const content = useIntlayer("BookingForm");

  const [formState, dispatchFormAction] = useReducer(
    bookingFormReducer,
    buildInitialBookingFormState(initialSelection),
  );

  const photos = usePhotoSelection();

  const validation = useBookingFormValidation({ serverFieldErrorCodes });

  const fieldErrors = resolveFieldErrorMessages(
    validation.fieldErrorCodes,
    content,
  );
  const formErrorMessage = resolveFormErrorMessage(
    validation.fieldErrorCodes,
    content,
  );

  const isSubmitting = fetcher.state !== "idle";

  return (
    <fetcher.Form
      className={styles.booking_form}
      method="post"
      noValidate
      onSubmit={validation.handleSubmit}
      onInput={validation.handleRevalidate}
      onBlur={validation.handleRevalidate}
    >
      <SpamGuardFields draftId={photos.draftId} />

      {/* Personal details */}
      <section className={styles.section}>
        <h2 className={styles.heading}>{content.personalInfoHeading}</h2>
        <div
          className={styles.field}
          data-field
          data-required
          data-invalid={fieldErrors.customerName !== undefined || undefined}
        >
          <label htmlFor="customerName">{content.nameLabel}</label>
          <input
            id="customerName"
            name="customerName"
            required
            placeholder={content.namePlaceholder.value}
            autoComplete="name"
            maxLength={35}
            {...invalidFieldProps("customerName", fieldErrors.customerName)}
          />
          <FieldError
            fieldName="customerName"
            message={fieldErrors.customerName}
          />
        </div>

        <div
          className={styles.field}
          data-field
          data-required
          data-invalid={fieldErrors.customerEmail !== undefined || undefined}
        >
          <label htmlFor="customerEmail">{content.emailLabel}</label>
          <input
            id="customerEmail"
            name="customerEmail"
            type="email"
            inputMode="email"
            required
            placeholder={content.emailPlaceholder.value}
            autoComplete="email"
            maxLength={45}
            {...invalidFieldProps("customerEmail", fieldErrors.customerEmail)}
          />
          <FieldError
            fieldName="customerEmail"
            message={fieldErrors.customerEmail}
          />
        </div>

        <div
          className={styles.field}
          data-field
          data-required
          data-invalid={fieldErrors.customerPhone !== undefined || undefined}
        >
          <label htmlFor="customerPhone">{content.phoneLabel}</label>
          <input
            id="customerPhone"
            name="customerPhone"
            type="tel"
            inputMode="tel"
            required
            placeholder={content.phonePlaceholder.value}
            autoComplete="tel"
            maxLength={20}
            {...invalidFieldProps("customerPhone", fieldErrors.customerPhone)}
          />
          <FieldError
            fieldName="customerPhone"
            message={fieldErrors.customerPhone}
          />
        </div>
      </section>

      {/* Appointment */}
      <section className={styles.section}>
        <h2 className={styles.heading}>{content.appointmentHeading}</h2>
        <fieldset
          className={styles.radio_group}
          data-field
          data-invalid={fieldErrors.serviceCategory !== undefined || undefined}
        >
          <legend>{content.serviceCategoryLegend}</legend>

          <div
            role="radiogroup"
            data-radio-group
            {...invalidFieldProps("serviceCategory", fieldErrors.serviceCategory)}
          >
            {SERVICE_CATEGORIES.map((serviceCategory) => {
              const optionId = `serviceCategory-${serviceCategory}`;

              return (
                <div
                  key={serviceCategory}
                  data-radio-option
                  data-selected={
                    formState.serviceCategory === serviceCategory || undefined
                  }
                >
                  <input
                    id={optionId}
                    type="radio"
                    name="serviceCategory"
                    value={serviceCategory}
                    checked={formState.serviceCategory === serviceCategory}
                    onChange={() =>
                      dispatchFormAction({
                        type: "serviceCategorySelected",
                        serviceCategory,
                      })
                    }
                  />
                  <label htmlFor={optionId}>
                    {content[SERVICE_CATEGORY_CONTENT_KEYS[serviceCategory]]}
                  </label>
                </div>
              );
            })}

            <FieldError
              fieldName="serviceCategory"
              message={fieldErrors.serviceCategory}
            />
          </div>
        </fieldset>

        <ServiceTypeField
          serviceCategory={formState.serviceCategory}
          selectedValue={formState.serviceType}
          errorMessage={fieldErrors.serviceType}
          onValueChange={(serviceType) =>
            dispatchFormAction({ type: "serviceTypeSelected", serviceType })
          }
          content={content}
        />

        <div className={styles.artist_and_times}>
          <ArtistField
            serviceCategory={formState.serviceCategory}
            artists={artists}
            selectedValue={formState.artistSelection}
            errorMessage={fieldErrors.artistSelection}
            onValueChange={(artistSelection) =>
              dispatchFormAction({ type: "artistSelected", artistSelection })
            }
            content={content}
          />
          {hasSelectedServiceType(formState) && (
            <div
              className={styles.field}
              data-field
              data-invalid={
                fieldErrors.preferredTimes !== undefined || undefined
              }
            >
              <label htmlFor="preferredTimes">
                {content.preferredTimesLabel}
              </label>
              <input
                id="preferredTimes"
                name="preferredTimes"
                placeholder={content.preferredTimesPlaceholder.value}
                maxLength={40}
                {...invalidFieldProps(
                  "preferredTimes",
                  fieldErrors.preferredTimes,
                )}
              />
              <FieldError
                fieldName="preferredTimes"
                message={fieldErrors.preferredTimes}
              />
            </div>
          )}
        </div>
      </section>

      {/* Design details */}
      {formState.serviceCategory !== null && (
        <section className={styles.section}>
          <h2 className={styles.heading}>{content.designDetailsHeading}</h2>

          <div
            className={`${styles.field} ${styles.full_width}`}
            data-field
            data-required
            data-invalid={fieldErrors.description !== undefined || undefined}
          >
            <label htmlFor="description" data-field-label>
              {content.descriptionLabel}
            </label>
            <textarea
              id="description"
              name="description"
              required
              rows={4}
              placeholder={content.descriptionPlaceholder.value}
              maxLength={500}
              {...invalidFieldProps("description", fieldErrors.description)}
            />
            <FieldError
              fieldName="description"
              message={fieldErrors.description}
            />
          </div>

          {formState.serviceCategory !== "other" && (
            <>
              <div
                className={styles.field}
                data-field
                data-required
                data-invalid={
                  fieldErrors.bodyPlacement !== undefined || undefined
                }
              >
                <label htmlFor="bodyPlacement" data-field-label>
                  {content.bodyPlacementLabel}
                </label>
                <input
                  id="bodyPlacement"
                  name="bodyPlacement"
                  required
                  placeholder={content.bodyPlacementPlaceholder.value}
                  maxLength={30}
                  list={BODY_PLACEMENT_SUGGESTIONS_ID}
                  {...invalidFieldProps(
                    "bodyPlacement",
                    fieldErrors.bodyPlacement,
                  )}
                />
                <FieldError
                  fieldName="bodyPlacement"
                  message={fieldErrors.bodyPlacement}
                />
              </div>

              <datalist id={BODY_PLACEMENT_SUGGESTIONS_ID}>
                {BODY_PLACEMENT_CONTENT_KEYS.map((contentKey) => (
                  <option key={contentKey} value={content[contentKey].value} />
                ))}
              </datalist>
            </>
          )}

          <PhotoUploadField
            field={{
              name: "photos",
              label: content.photosLabel.value,
              hint: content.photosHint.value,
              errorMessage: fieldErrors.photoKeys,
            }}
            photos={photos}
            resolveMessages={(entry) => resolvePhotoMessages(entry, content)}
            chooseFilesLabel={content.chooseFilesLabel.value}
          />

          <div
            className={`${styles.field} ${styles.full_width}`}
            data-field
            data-invalid={fieldErrors.referenceLink !== undefined || undefined}
          >
            <label htmlFor="referenceLink">{content.referenceLinkLabel}</label>
            <p data-field-hint>{content.referenceLinkHint}</p>
            <input
              id="referenceLink"
              name="referenceLink"
              type="url"
              inputMode="url"
              placeholder="https://"
              maxLength={200}
              {...invalidFieldProps("referenceLink", fieldErrors.referenceLink)}
            />
            <FieldError
              fieldName="referenceLink"
              message={fieldErrors.referenceLink}
            />
          </div>

          {formState.serviceCategory === "tattoo" && (
            <>
              <div
                className={styles.field}
                data-field
                data-invalid={
                  fieldErrors.preferredStyle !== undefined || undefined
                }
              >
                <div>
                  <label htmlFor="preferredStyle" data-field-label>
                    {content.preferredStyleLabel}
                  </label>
                  <LocalizedLink
                    className={styles.guide_link}
                    to={TATTOO_STYLES_PAGE_PATH}
                  >
                    {content.styleGuideLinkLabel}
                  </LocalizedLink>
                </div>
                <select
                  id="preferredStyle"
                  name="preferredStyle"
                  defaultValue=""
                  {...invalidFieldProps(
                    "preferredStyle",
                    fieldErrors.preferredStyle,
                  )}
                >
                  <option value="" disabled>
                    {content.preferredStylePlaceholderOption}
                  </option>
                  {TATTOO_STYLES.map((style) => (
                    <option key={style.value} value={style.value}>
                      {style.label}
                    </option>
                  ))}
                </select>
                <FieldError
                  fieldName="preferredStyle"
                  message={fieldErrors.preferredStyle}
                />
              </div>

              <div
                className={styles.field}
                data-field
                data-invalid={
                  fieldErrors.approxSizeCm !== undefined || undefined
                }
              >
                <label htmlFor="approxSizeCm" data-field-label>
                  {content.approxSizeLabel}
                </label>
                <input
                  id="approxSizeCm"
                  name="approxSizeCm"
                  inputMode="decimal"
                  placeholder={content.approxSizePlaceholder.value}
                  maxLength={60}
                  {...invalidFieldProps(
                    "approxSizeCm",
                    fieldErrors.approxSizeCm,
                  )}
                />
                <FieldError
                  fieldName="approxSizeCm"
                  message={fieldErrors.approxSizeCm}
                />
              </div>

              <div
                className={styles.field}
                data-field
                data-invalid={
                  fieldErrors.budgetRange !== undefined || undefined
                }
              >
                <label htmlFor="budgetRange" data-field-label>
                  {content.budgetLabel}
                </label>
                <select
                  id="budgetRange"
                  name="budgetRange"
                  defaultValue=""
                  {...invalidFieldProps("budgetRange", fieldErrors.budgetRange)}
                >
                  <option value="" disabled>
                    {content.budgetPlaceholderOption}
                  </option>
                  {BUDGET_RANGES.map((budget) => (
                    <option key={budget.value} value={budget.value}>
                      {budget.label}
                    </option>
                  ))}
                </select>
                <FieldError
                  fieldName="budgetRange"
                  message={fieldErrors.budgetRange}
                />
              </div>
            </>
          )}
        </section>
      )}

      {/* Consent */}
      <section data-booking-section="consent" className={styles.section}>
        <h2 className={styles.heading}>{content.consentHeading}</h2>

        <FirstTimeCheckbox
          serviceCategory={formState.serviceCategory}
          content={content}
        />

        <div
          className={styles.checkbox_field}
          data-field
          data-field-checkbox
          data-invalid={fieldErrors.marketingConsent !== undefined || undefined}
        >
          <input
            id="marketingConsent"
            type="checkbox"
            name="marketingConsent"
            value="on"
            {...invalidFieldProps(
              "marketingConsent",
              fieldErrors.marketingConsent,
            )}
          />
          <label htmlFor="marketingConsent" data-field-label>
            {content.marketingConsentLabel}
          </label>
          <p data-field-hint>{content.marketingConsentHint}</p>
          <FieldError
            fieldName="marketingConsent"
            message={fieldErrors.marketingConsent}
          />
        </div>

        <div
          className={styles.checkbox_field}
          data-field
          data-field-checkbox
          data-required
          data-invalid={fieldErrors.privacyConsent !== undefined || undefined}
        >
          <input
            id="privacyConsent"
            type="checkbox"
            name="privacyConsent"
            value="on"
            required
            {...invalidFieldProps("privacyConsent", fieldErrors.privacyConsent)}
          />
          <label htmlFor="privacyConsent">
            {content.privacyConsentPrefix}
            <a href="#">{content.privacyConsentLinkLabel}</a>
            {content.privacyConsentSuffix}
          </label>
          <FieldError
            fieldName="privacyConsent"
            message={fieldErrors.privacyConsent}
          />
        </div>
      </section>

      {/* <TurnstileWidget siteKey={turnstileSiteKey} className={styles.full_width} /> */}

      <div className={styles.full_width}>
        <SubmitButton
          label={content.submitLabel.value}
          submittingLabel={content.submittingLabel.value}
          isSubmitting={isSubmitting}
          isDisabled={photos.hasUploadInFlight}
        />

        {formErrorMessage !== undefined && (
          <p className={styles.form_error} role="alert">
            {formErrorMessage}
          </p>
        )}
      </div>
    </fetcher.Form>
  );
}
