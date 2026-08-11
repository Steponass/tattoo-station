import { t, type Dictionary } from "intlayer";

/**
 * Copy for the booking form.
 *
 * Service categories, service types and photo rejection reasons are keyed by
 * the values in `~/lib/booking/bookingConstants` and `usePhotoSelection`, so
 * the form can resolve their display text by value. Budget ranges and tattoo
 * styles are deliberately absent: they carry their labels on the constants
 * themselves and are not translated.
 */
const bookingformContent = {
  key: "BookingForm",
  content: {
    // Personal details
    personalInfoHeading: t({
      lt: "Kontaktinė informacija",
      en: "Personal info",
    }),
    nameLabel: t({
      lt: "Vardas ir pavardė*",
      en: "Full name*",
    }),
    namePlaceholder: t({
      lt: "Lina",
      en: "Lina",
    }),
    emailLabel: t({
      lt: "El. paštas*",
      en: "Email*",
    }),
    emailPlaceholder: t({
      lt: "lina@domenas.lt",
      en: "lina@domain.com",
    }),
    phoneLabel: t({
      lt: "Telefono numeris*",
      en: "Phone number*",
    }),
    phonePlaceholder: t({
      lt: "+370 612 34567",
      en: "+370 612 34567",
    }),

    // Appointment
    appointmentHeading: t({
      lt: "Vizitas",
      en: "Appointment",
    }),
    serviceCategoryLegend: t({
      lt: "Kas domina?*",
      en: "What are you booking for?*",
    }),
    serviceCategoryTattoo: t({
      lt: "Tatuiruotė",
      en: "Tattoo",
    }),
    serviceCategoryPiercing: t({
      lt: "Auskarų vėrimas",
      en: "Piercing",
    }),
    serviceCategoryOther: t({
      lt: "Kita",
      en: "Something else",
    }),

    serviceTypeLegend: t({
      lt: "Tipas*",
      en: "Type*",
    }),
    tattooTypeNew: t({
      lt: "Nauja tatuiruotė",
      en: "New tattoo",
    }),
    tattooTypeCoverUp: t({
      lt: "Senos perdengimas",
      en: "Cover-up",
    }),
    tattooTypeTouchUp: t({
      lt: "Atnaujinimas",
      en: "Touch-up",
    }),
    tattooTypeConsultation: t({
      lt: "Konsultacija",
      en: "Consultation",
    }),
    piercingTypeNew: t({
      lt: "Naujas vėrimas",
      en: "New piercing",
    }),
    piercingTypeJewelryChange: t({
      lt: "Papuošalo keitimas",
      en: "Jewelry change",
    }),
    piercingTypeConsultation: t({
      lt: "Konsultacija",
      en: "Consultation",
    }),

    artistLabel: t({
      lt: "Meistras*",
      en: "Artist*",
    }),
    artistPlaceholderOption: t({
      lt: "Pasirink meistrą",
      en: "Select an artist",
    }),
    artistNoPreference: t({
      lt: "Neturiu pageidavimo",
      en: "No preference",
    }),

    preferredTimesLabel: t({
      lt: "Norimos dienos / laikas",
      en: "Preferred dates / times",
    }),
    preferredTimesPlaceholder: t({
      lt: "pvz. darbo dienų vakarais",
      en: "e.g. weekday evenings",
    }),

    // Design details
    designDetailsHeading: t({
      lt: "Idėjos detalės",
      en: "Design details",
    }),
    descriptionLabel: t({
      lt: "Ką turi galvoje?*",
      en: "What do you have in mind?*",
    }),
    descriptionPlaceholder: t({
      lt: "Viskas, kas padėtų mums pasiruošti",
      en: "Anything that helps us prepare",
    }),

    bodyPlacementLabel: t({
      lt: "Vieta ant kūno*",
      en: "Placement*",
    }),
    bodyPlacementPlaceholder: t({
      lt: "pvz. nugara",
      en: "e.g. shoulder",
    }),
    placementForearm: t({ lt: "Dilbis", en: "Forearm" }),
    placementUpperArm: t({ lt: "Žastas", en: "Upper arm" }),
    placementShoulder: t({ lt: "Petys", en: "Shoulder" }),
    placementChest: t({ lt: "Krūtinė", en: "Chest" }),
    placementBack: t({ lt: "Nugara", en: "Back" }),
    placementRibs: t({ lt: "Šonkauliai", en: "Ribs" }),
    placementThigh: t({ lt: "Šlaunis", en: "Thigh" }),
    placementCalf: t({ lt: "Blauzda", en: "Calf" }),
    placementAnkle: t({ lt: "Kulkšnis", en: "Ankle" }),
    placementHand: t({ lt: "Plaštaka", en: "Hand" }),
    placementNeck: t({ lt: "Kaklas", en: "Neck" }),

    photosLabel: t({
      lt: "Turi nuotraukų ar pavyzdžių?",
      en: "Any images or photos?",
    }),
    photosHint: t({
      lt: "Iki 5 nuotraukų, po 5MB.",
      en: "Up to 5 photos, 5MB each.",
    }),
    chooseFilesLabel: t({
      lt: "Pasirink failus",
      en: "Choose files",
    }),
    photoUploading: t({
      lt: "Įkeliama…",
      en: "Uploading…",
    }),
    photoUploaded: t({
      lt: "Įkelta",
      en: "Uploaded",
    }),
    photoRetryLabel: t({
      lt: "Bandyti dar kartą",
      en: "Retry",
    }),
    photoRemoveLabel: t({
      lt: "Pašalinti",
      en: "Remove",
    }),
    photoUploadFailed: t({
      lt: "Nepavyko įkelti. Bandyk dar kartą.",
      en: "Upload failed. Please try again.",
    }),
    photoPreviewUnavailable: t({
      lt: "Peržiūra nepasiekiama — vis tiek bus įkelta.",
      en: "Preview unavailable — will still upload.",
    }),
    photoTooManyPhotos: t({
      lt: "Galima įkelti iki 5 nuotraukų.",
      en: "You can upload up to 5 photos.",
    }),
    photoFileTooLarge: t({
      lt: "Failas per didelis (daugiausia 5MB).",
      en: "That file is too large (max 5MB).",
    }),
    photoUnsupportedFileType: t({
      lt: "Toks failo tipas nepalaikomas.",
      en: "That file type isn't supported.",
    }),

    referenceLinkLabel: t({
      lt: "Turi nuorodų?",
      en: "Any links?",
    }),
    preferredStyleLabel: t({
      lt: "Norimas stilius",
      en: "Preferred style",
    }),
    preferredStylePlaceholderOption: t({
      lt: "Pasirink stilių",
      en: "Select a style",
    }),
    styleGuideLinkLabel: t({
      lt: "Gidas",
      en: "Guide",
    }),

    approxSizeLabel: t({
      lt: "Apytikslis dydis (cm)",
      en: "Approximate size (cm)",
    }),
    approxSizePlaceholder: t({
      lt: "pvz. 10",
      en: "e.g. 10",
    }),

    budgetLabel: t({
      lt: "Biudžetas",
      en: "Budget",
    }),
    budgetPlaceholderOption: t({
      lt: "Pasirink biudžetą",
      en: "Select a budget",
    }),

    // Consent
    consentHeading: t({
      lt: "Prieš išeinant",
      en: "Before you go",
    }),
    firstTimeTattoo: t({
      lt: "Tai mano pirma tatuiruotė",
      en: "This is my first tattoo",
    }),
    firstTimePiercing: t({
      lt: "Tai mano pirmas vėrimas",
      en: "This is my first piercing",
    }),
    marketingConsentLabel: t({
      lt: "Noriu gauti naujienas ir pasiūlymus",
      en: "Keep me updated about news and offers",
    }),
    marketingConsentHint: t({
      lt: "Neprivaloma — atsisakyti gali bet kada.",
      en: "Optional — you can unsubscribe anytime.",
    }),
    privacyConsentPrefix: t({
      lt: "Sutinku su ",
      en: "I agree to the ",
    }),
    privacyConsentLinkLabel: t({
      lt: "privatumo politika",
      en: "privacy policy",
    }),
    privacyConsentSuffix: t({
      lt: "*",
      en: "*",
    }),

    // Submission
    submitLabel: t({
      lt: "Siųsti užklausą",
      en: "Send request",
    }),
    submittingLabel: t({
      lt: "Siunčiama…",
      en: "Sending…",
    }),

    // Validation errors, keyed by field and error code in `BookingForm.tsx`.
    // Field-specific wording comes first; the generic messages below cover the
    // codes whose meaning is already obvious beside the field that produced it.
    errorNameRequired: t({
      lt: "Įrašyk savo vardą",
      en: "Please enter your name",
    }),
    errorEmailRequired: t({
      lt: "Įrašyk el. pašto adresą",
      en: "Please enter your email address",
    }),
    errorEmailInvalid: t({
      lt: "Patikrink el. pašto adresą",
      en: "Please check your email address",
    }),
    errorPhoneRequired: t({
      lt: "Įrašyk telefono numerį",
      en: "Please enter your phone number",
    }),
    errorPhoneInvalid: t({
      lt: "Patikrink telefono numerį",
      en: "Please check your phone number",
    }),
    errorServiceCategoryRequired: t({
      lt: "Pasirink, ko atvyksti",
      en: "Please choose what you're booking for",
    }),
    errorServiceTypeRequired: t({
      lt: "Pasirink tipą",
      en: "Please choose a type",
    }),
    errorArtistRequired: t({
      lt: "Pasirink meistrą",
      en: "Please choose an artist",
    }),
    errorDescriptionRequired: t({
      lt: "Trumpai aprašyk, ką turi galvoje",
      en: "Please tell us what you have in mind",
    }),
    errorDescriptionTooShort: t({
      lt: "Parašyk šiek tiek daugiau",
      en: "Please tell us a little more",
    }),
    errorBodyPlacementRequired: t({
      lt: "Nurodyk vietą ant kūno",
      en: "Please tell us the placement",
    }),
    errorPrivacyConsentRequired: t({
      lt: "Norint tęsti reikia sutikti su privatumo politika",
      en: "Please agree to the privacy policy to continue",
    }),
    errorPhotosTooMany: t({
      lt: "Galima įkelti iki 5 nuotraukų",
      en: "You can upload up to 5 photos",
    }),

    errorRequired: t({
      lt: "Šis laukas privalomas",
      en: "This field is required",
    }),
    errorTooShort: t({
      lt: "Šiek tiek per trumpas",
      en: "That's a little too short",
    }),
    errorTooLong: t({
      lt: "Šiek tiek per ilgas — sutrumpink",
      en: "That's a little too long — please shorten it",
    }),
    errorInvalidOption: t({
      lt: "Pasirink vieną iš pateiktų variantų",
      en: "Please choose one of the available options",
    }),
    errorInvalidNumber: t({
      lt: "Įrašyk skaičių",
      en: "Please enter a number",
    }),
    errorNumberOutOfRange: t({
      lt: "Toks dydis netinka",
      en: "That size is out of range",
    }),

    errorFormIncomplete: t({
      lt: "Patikrink pažymėtus laukus",
      en: "Please check the highlighted fields",
    }),
    errorFormGeneric: t({
      lt: "Nepavyko išsiųsti. Bandyk dar kartą.",
      en: "Something went wrong. Please try again.",
    }),
  },
} satisfies Dictionary;

export default bookingformContent;
