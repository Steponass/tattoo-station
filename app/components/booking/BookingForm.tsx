// app/components/booking/BookingForm.tsx

import { useReducer } from "react";
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
  initialBookingFormState,
  type BookingFormState,
} from "~/lib/booking/bookingFormReducer";
import type { BookingFieldErrors } from "~/lib/booking/bookingSubmissionTypes";
import { filterArtistsForCategory } from "~/lib/booking/filterArtistsForCategory";
import { usePhotoSelection } from "~/lib/booking/usePhotoSelection";
import type { PhotoEntry } from "~/lib/booking/usePhotoSelection";
import { PhotoUploadField } from "./photos/PhotoUploadField";
import type { PhotoStatusMessages } from "./photos/PhotoPreviewItem";
import { SpamGuardFields } from "./SpamGuardFields";
import { SubmitButton } from "./SubmitButton";
import { TurnstileWidget } from "./TurnstileWidget";
import styles from "./BookingForm.module.css";

const SERVICE_CATEGORY_LABELS: Record<ServiceCategory, string> = {
  tattoo: "Tattoo",
  piercing: "Piercing",
  other: "Something else",
};

const SERVICE_TYPE_LABELS: Record<string, Record<string, string>> = {
  tattoo: {
    new: "New tattoo",
    cover_up: "Cover-up",
    touch_up: "Touch-up",
    consultation: "Consultation",
  },
  piercing: {
    new: "New piercing",
    jewelry_change: "Jewelry change",
    consultation: "Consultation",
  },
};

const FIRST_TIME_LABELS: Record<string, string> = {
  tattoo: "This is my first tattoo",
  piercing: "This is my first piercing",
};

const PHOTO_STATUS_MESSAGES = {
  uploading: "Uploading…",
  uploaded: "Uploaded",
  retryLabel: "Retry",
  removeLabel: "Remove",
  uploadFailed: "Upload failed. Please try again.",
  rejectionMessages: {
    too_many_photos: "You can upload up to 5 photos.",
    file_too_large: "That file is too large (max 5MB).",
    unsupported_file_type: "That file type isn't supported.",
  },
};

const BODY_PLACEMENT_SUGGESTIONS_ID = "body-placement-suggestions";

const BODY_PLACEMENT_SUGGESTIONS = [
  "Forearm",
  "Upper arm",
  "Shoulder",
  "Chest",
  "Back",
  "Ribs",
  "Thigh",
  "Calf",
  "Ankle",
  "Hand",
  "Neck",
];

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

function resolvePhotoMessages(entry: PhotoEntry): PhotoStatusMessages {
  const problemMessage =
    entry.rejectionCode === null
      ? PHOTO_STATUS_MESSAGES.uploadFailed
      : PHOTO_STATUS_MESSAGES.rejectionMessages[entry.rejectionCode];

  return {
    uploading: PHOTO_STATUS_MESSAGES.uploading,
    uploaded: PHOTO_STATUS_MESSAGES.uploaded,
    retryLabel: PHOTO_STATUS_MESSAGES.retryLabel,
    removeLabel: PHOTO_STATUS_MESSAGES.removeLabel,
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
  onValueChange,
}: {
  serviceCategory: ServiceCategory | null;
  selectedValue: ServiceType | null;
  onValueChange: (serviceType: ServiceType) => void;
}) {
  if (serviceCategory === null) {
    return null;
  }

  const options = SERVICE_TYPES_BY_CATEGORY[serviceCategory];

  if (options.length === 0) {
    return null;
  }

  return (
    <fieldset className={styles.radio_group}>
      <legend data-field-label>Type*</legend>

      <div role="radiogroup" data-radio-group>
        {options.map((serviceType) => {
          const optionId = `serviceType-${serviceType}`;
          const label =
            SERVICE_TYPE_LABELS[serviceCategory]?.[serviceType] ?? serviceType;

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
      </div>
    </fieldset>
  );
}

function ArtistField({
  serviceCategory,
  artists,
  selectedValue,
  onValueChange,
}: {
  serviceCategory: ServiceCategory | null;
  artists: readonly BookableArtist[];
  selectedValue: string | null;
  errorMessage?: string;
  onValueChange: (artistSelection: string) => void;
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
    <div className={styles.field}>
      <label htmlFor={selectId} data-field-label>
        Artist*
      </label>

      <select
        id={selectId}
        name="artistSelection"
        required
        value={selectedValue ?? ""}
        onChange={(event) => onValueChange(event.currentTarget.value)}
      >
        <option value="" disabled>
          Select an artist
        </option>

        {showNotSpecifiedOption && (
          <option value={ARTIST_NOT_SPECIFIED}>No preference</option>
        )}

        {eligibleArtists.map((artist) => (
          <option key={artist.id} value={String(artist.id)}>
            {artist.displayName}
          </option>
        ))}
      </select>
    </div>
  );
}

/**
 * Wording depends on the service ("tattooed" vs "pierced"), so the checkbox is
 * absent until a category is chosen.
 */
function FirstTimeCheckbox({
  serviceCategory,
}: {
  serviceCategory: ServiceCategory | null;
  errorMessage?: string;
}) {
  if (serviceCategory === null) {
    return null;
  }

  const label = FIRST_TIME_LABELS[serviceCategory];

  if (label === undefined) {
    return null;
  }

  return (
    <div className={styles.checkbox_field}>
      <input id="isFirstTime" type="checkbox" name="isFirstTime" value="on" />
      <label htmlFor="isFirstTime">{label}</label>
    </div>
  );
}

export function BookingForm({
  artists,
  turnstileSiteKey,
  fieldErrors,
  fetcher,
}: {
  artists: readonly BookableArtist[];
  turnstileSiteKey: string;
  fieldErrors: BookingFieldErrors;
  fetcher: FetcherWithComponents<unknown>;
}) {
  const [formState, dispatchFormAction] = useReducer(
    bookingFormReducer,
    initialBookingFormState,
  );

  const photos = usePhotoSelection();

  const isSubmitting = fetcher.state !== "idle";

  return (
    <fetcher.Form className={styles.booking_form} method="post" noValidate>
      <SpamGuardFields draftId={photos.draftId} />

      {/* Personal details */}
      <section className={styles.section}>
        <h2 className={styles.heading}>Personal info</h2>
        <div className={styles.field}>
          <label htmlFor="customerName">Full name*</label>
          <input
            id="customerName"
            name="customerName"
            required
            placeholder="Lina"
            autoComplete="name"
            maxLength={35}
          />
        </div>

        <div className={styles.field}>
          <label htmlFor="customerEmail">Email*</label>
          <input
            id="customerEmail"
            name="customerEmail"
            type="email"
            inputMode="email"
            required
            placeholder="youremail@domain.com"
            autoComplete="email"
            maxLength={45}
          />
        </div>

        <div className={styles.field}>
          <label htmlFor="customerPhone">Phone number*</label>
          <input
            id="customerPhone"
            name="customerPhone"
            type="tel"
            inputMode="tel"
            required
            placeholder="+370 612 34567"
            autoComplete="tel"
            maxLength={20}
          />
        </div>
      </section>

      {/* Appointment */}
      <section className={styles.section}>
        <h2 className={styles.heading}>Appointment</h2>
        <fieldset className={styles.radio_group}>
          <legend>What are you booking for?*</legend>

          <div role="radiogroup" data-radio-group>
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
                    {SERVICE_CATEGORY_LABELS[serviceCategory]}
                  </label>
                </div>
              );
            })}
          </div>
        </fieldset>

        <ServiceTypeField
          serviceCategory={formState.serviceCategory}
          selectedValue={formState.serviceType}
          onValueChange={(serviceType) =>
            dispatchFormAction({ type: "serviceTypeSelected", serviceType })
          }
        />

        <div className={styles.artist_and_times}>
          <ArtistField
            serviceCategory={formState.serviceCategory}
            artists={artists}
            selectedValue={formState.artistSelection}
            onValueChange={(artistSelection) =>
              dispatchFormAction({ type: "artistSelected", artistSelection })
            }
          />
          {hasSelectedServiceType(formState) && (
            <div className={styles.field}>
              <label htmlFor="preferredTimes">Preferred dates / times</label>
              <input
                id="preferredTimes"
                name="preferredTimes"
                placeholder="e.g. weekday evenings"
                maxLength={40}
              />
            </div>
          )}
        </div>
      </section>

      {/* Design details */}
      {formState.serviceCategory !== null && (
        <section className={styles.section}>
          <h2 className={styles.heading}>Design details</h2>

          <div
            className={`${styles.field} ${styles.full_width}`}
            data-field
            data-required
          >
            <label htmlFor="description" data-field-label>
              What do you have in mind?*
            </label>
            <textarea
              id="description"
              name="description"
              required
              rows={4}
              placeholder="Anything that helps us prepare"
              maxLength={500}
            />
                    {formState.serviceCategory !== "other" && (
            <>
              <div
                className={styles.field}
                data-field
                data-required
              >
                <label htmlFor="bodyPlacement" data-field-label>
                  Placement*
                </label>
                <input
                  id="bodyPlacement"
                  name="bodyPlacement"
                  required
                  placeholder="e.g. Forearm"
                  maxLength={30}
                  list={BODY_PLACEMENT_SUGGESTIONS_ID}
                />
              </div>

              <datalist id={BODY_PLACEMENT_SUGGESTIONS_ID}>
                {BODY_PLACEMENT_SUGGESTIONS.map((suggestion) => (
                  <option key={suggestion} value={suggestion} />
                ))}
              </datalist>
            </>
          )}
          </div>

          <PhotoUploadField
            field={{
              name: "photos",
              label: "Any images or photos?",
              hint: "Up to 5 photos, 5MB each.",
            }}
            photos={photos}
            resolveMessages={resolvePhotoMessages}
            chooseFilesLabel="Choose files"
          />

          <div
            className={`${styles.field} ${styles.full_width}`}
            data-field
          >
            <label htmlFor="referenceLink">
              Any links?
            </label>
            <p data-field-hint>Instagram post or similar.</p>
            <input
              id="referenceLink"
              name="referenceLink"
              type="url"
              inputMode="url"
              placeholder="https://"
              maxLength={200}
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
                <label htmlFor="preferredStyle" data-field-label>
                  Preferred style
                </label>
                <select
                  id="preferredStyle"
                  name="preferredStyle"
                  defaultValue=""
                  aria-invalid={
                    fieldErrors.preferredStyle !== undefined || undefined
                  }
                >
                  <option value="" disabled>
                    Select a style
                  </option>
                  {TATTOO_STYLES.map((style) => (
                    <option key={style.value} value={style.value}>
                      {style.label}
                    </option>
                  ))}
                </select>
                {fieldErrors.preferredStyle !== undefined && (
                  <p data-field-error role="alert">
                    {fieldErrors.preferredStyle}
                  </p>
                )}
              </div>



              <div
                className={styles.field}
                data-field
                data-invalid={
                  fieldErrors.approxSizeCm !== undefined || undefined
                }
              >
                <label htmlFor="approxSizeCm" data-field-label>
                  Approximate size (cm)
                </label>
                <input
                  id="approxSizeCm"
                  name="approxSizeCm"
                  inputMode="decimal"
                  placeholder="e.g. 10"
                  maxLength={60}
                  aria-invalid={
                    fieldErrors.approxSizeCm !== undefined || undefined
                  }
                />
                {fieldErrors.approxSizeCm !== undefined && (
                  <p data-field-error role="alert">
                    {fieldErrors.approxSizeCm}
                  </p>
                )}
              </div>

              <div
                className={styles.field}
                data-field
                data-invalid={
                  fieldErrors.budgetRange !== undefined || undefined
                }
              >
                <label htmlFor="budgetRange" data-field-label>
                  Budget
                </label>
                <select
                  id="budgetRange"
                  name="budgetRange"
                  defaultValue=""
                  aria-invalid={
                    fieldErrors.budgetRange !== undefined || undefined
                  }
                >
                  <option value="" disabled>
                    Select a budget
                  </option>
                  {BUDGET_RANGES.map((budget) => (
                    <option key={budget.value} value={budget.value}>
                      {budget.label}
                    </option>
                  ))}
                </select>
                {fieldErrors.budgetRange !== undefined && (
                  <p data-field-error role="alert">
                    {fieldErrors.budgetRange}
                  </p>
                )}
              </div>
            </>
          )}
        </section>
      )}

      {/* Consent */}
      <section data-booking-section="consent" className={styles.section}>
        <h2 className={styles.heading}>Before you go</h2>

        <FirstTimeCheckbox
          serviceCategory={formState.serviceCategory}
          errorMessage={fieldErrors.isFirstTime}
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
          />
          <label htmlFor="marketingConsent" data-field-label>
            Keep me updated about news and offers
          </label>
          <p data-field-hint>Optional — you can unsubscribe anytime.</p>
          {fieldErrors.marketingConsent !== undefined && (
            <p data-field-error role="alert">
              {fieldErrors.marketingConsent}
            </p>
          )}
        </div>

        <div
          className={styles.checkbox_field}
          data-field
          data-field-checkbox
          data-required
        >
          <input
            id="privacyConsent"
            type="checkbox"
            name="privacyConsent"
            value="on"
            required
          />
          <label htmlFor="privacyConsent">
            I agree to the <a href="#">privacy policy</a>*
          </label>
        </div>
      </section>

      {/* <TurnstileWidget siteKey={turnstileSiteKey} className={styles.full_width} /> */}

      <div className={styles.full_width}>
        <SubmitButton
          label="Send request"
          submittingLabel="Sending…"
          isSubmitting={isSubmitting}
          isDisabled={photos.hasUploadInFlight}
        />
      </div>
    </fetcher.Form>
  );
}
