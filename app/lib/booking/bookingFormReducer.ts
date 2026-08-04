import type { ServiceCategory, ServiceType } from "./bookingConstants";
import type { ArtistPreselection } from "./resolveArtistPreselection";

/**
 * The three interdependent selections in the booking form.
 *
 * These live in a reducer rather than separate state because a single user
 * action changes more than one of them: choosing a service category invalidates
 * both the previously selected service type and the previously selected artist.
 * Every other field in the form is uncontrolled and read from FormData.
 */
export type BookingFormState = {
  serviceCategory: ServiceCategory | null;
  serviceType: ServiceType | null;
  artistSelection: string | null;
};

export const initialBookingFormState: BookingFormState = {
  serviceCategory: null,
  serviceType: null,
  artistSelection: null,
};

/**
 * Seeds the reducer with an artist (and its implied service category)
 * resolved from a `?artist=` link, or the plain blank state when there is
 * none. `serviceType` is never preselected — the link only carries category
 * and artist, both derived from who the visitor was looking at.
 */
export function buildInitialBookingFormState(
  preselection: ArtistPreselection,
): BookingFormState {
  if (preselection === null) {
    return initialBookingFormState;
  }

  return {
    serviceCategory: preselection.serviceCategory,
    serviceType: null,
    artistSelection: preselection.artistSelection,
  };
}

export type BookingFormAction =
  | { type: "serviceCategorySelected"; serviceCategory: ServiceCategory }
  | { type: "serviceTypeSelected"; serviceType: ServiceType }
  | { type: "artistSelected"; artistSelection: string }
  | { type: "formReset" };

export function bookingFormReducer(
  state: BookingFormState,
  action: BookingFormAction,
): BookingFormState {
  switch (action.type) {
    case "serviceCategorySelected": {
      if (state.serviceCategory === action.serviceCategory) {
        return state;
      }

      return {
        serviceCategory: action.serviceCategory,
        serviceType: null,
        artistSelection: null,
      };
    }

    case "serviceTypeSelected": {
      return { ...state, serviceType: action.serviceType };
    }

    case "artistSelected": {
      return { ...state, artistSelection: action.artistSelection };
    }

    case "formReset": {
      return initialBookingFormState;
    }
  }
}