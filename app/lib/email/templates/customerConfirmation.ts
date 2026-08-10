// app/lib/email/templates/customerConfirmation.ts

import { BUDGET_RANGES, TATTOO_STYLES } from "~/lib/booking/bookingConstants";
import type { BookingSubmission } from "~/lib/booking/bookingSubmissionTypes";

export type CustomerConfirmationInput = {
  customerName: string;
  reference: string;
  submission: BookingSubmission;
  locale: string;
};

export type EmailTemplate = {
  subject: string;
  html: string;
};

// ---------------------------------------------------------------------------
// Label resolvers — value → display string
// ---------------------------------------------------------------------------

const SERVICE_CATEGORY_LABELS: Record<string, { en: string; lt: string }> = {
  tattoo:   { en: "Tattoo",    lt: "Tatuiruotė" },
  piercing: { en: "Piercing",  lt: "Auskarų vėrimas" },
  other:    { en: "Other",     lt: "Kita" },
};

const SERVICE_TYPE_LABELS: Record<string, { en: string; lt: string }> = {
  new:           { en: "New",           lt: "Nauja" },
  cover_up:      { en: "Cover-up",      lt: "Senos perdengimas" },
  touch_up:      { en: "Touch-up",      lt: "Atnaujinimas" },
  consultation:  { en: "Consultation",  lt: "Konsultacija" },
  jewelry_change:{ en: "Jewelry change",lt: "Papuošalo keitimas" },
};

function resolveBudgetLabel(value: string): string {
  return BUDGET_RANGES.find((range) => range.value === value)?.label ?? value;
}

function resolveTattooStyleLabel(value: string): string {
  return TATTOO_STYLES.find((style) => style.value === value)?.label ?? value;
}

// ---------------------------------------------------------------------------
// Locale helpers
// ---------------------------------------------------------------------------

type SupportedLocale = "en" | "lt";

function resolveLocale(raw: string): SupportedLocale {
  return raw === "lt" ? "lt" : "en";
}

type LocalizedStrings = {
  subject: string;
  intro: string;
  referenceLabel: string;
  serviceLabel: string;
  typeLabel: string;
  descriptionLabel: string;
  bodyPlacementLabel: string;
  styleLabel: string;
  sizeLabel: string;
  budgetLabel: string;
  preferredTimesLabel: string;
  firstTimeLabel: string;
  firstTimeYes: string;
  firstTimeNo: string;
  nextSteps: string;
  closing: string;
  signature: string;
};

const STRINGS: Record<SupportedLocale, LocalizedStrings> = {
  en: {
    subject:             "We've received your booking request",
    intro:               "Thank you for reaching out. Here's a summary of what you sent us — we'll be in touch shortly to confirm the details.",
    referenceLabel:      "Reference",
    serviceLabel:        "Service",
    typeLabel:           "Type",
    descriptionLabel:    "Description",
    bodyPlacementLabel:  "Placement",
    styleLabel:          "Style",
    sizeLabel:           "Approx. size",
    budgetLabel:         "Budget",
    preferredTimesLabel: "Preferred times",
    firstTimeLabel:      "First time at Tattoo Station",
    firstTimeYes:        "Yes",
    firstTimeNo:         "No",
    nextSteps:           "Our team will review your request and reach out to discuss availability and next steps.",
    closing:             "See you soon,",
    signature:           "Tattoo Station",
  },
  lt: {
    subject:             "Gavome jūsų rezervacijos užklausą",
    intro:               "Ačiū, kad kreipėtės. Žemiau pateikiame jūsų užklausos santrauką — netrukus susisieksime ir patvirtinsime detales.",
    referenceLabel:      "Numeris",
    serviceLabel:        "Paslauga",
    typeLabel:           "Tipas",
    descriptionLabel:    "Aprašymas",
    bodyPlacementLabel:  "Vieta",
    styleLabel:          "Stilius",
    sizeLabel:           "Apytikris dydis",
    budgetLabel:         "Biudžetas",
    preferredTimesLabel: "Pageidaujamas laikas",
    firstTimeLabel:      "Pirmas vizitas Tattoo Station",
    firstTimeYes:        "Taip",
    firstTimeNo:         "Ne",
    nextSteps:           "Mūsų komanda peržiūrės jūsų užklausą ir susisieks dėl laisvo laiko bei kitų žingsnių.",
    closing:             "Iki pasimatymo,",
    signature:           "Tattoo Station",
  },
};

// The greeting needs the name injected, so it's a function — but the type
// above stores a plain string to keep the Record shape uniform. We handle
// this with a dedicated helper rather than a ternary in the template.
function buildGreeting(locale: SupportedLocale, name: string): string {
  if (locale === "lt") {
    return `Sveiki, ${name},`;
  }
  return `Hi ${name},`;
}

// ---------------------------------------------------------------------------
// Detail row builder
// ---------------------------------------------------------------------------

function buildDetailRow(label: string, value: string | null | undefined): string {
  if (value === null || value === undefined || value.trim() === "") {
    return "";
  }

  return `
    <tr>
      <td style="padding: 6px 16px 6px 0; color: #888888; white-space: nowrap; vertical-align: top;">${label}</td>
      <td style="padding: 6px 0; vertical-align: top;">${value}</td>
    </tr>`;
}

// ---------------------------------------------------------------------------
// Submission field extractors
// ---------------------------------------------------------------------------

function resolveServiceTypeLabel(
  submission: BookingSubmission,
  locale: SupportedLocale,
): string | null {
  if (submission.serviceType === null) {
    return null;
  }
  return SERVICE_TYPE_LABELS[submission.serviceType]?.[locale] ?? submission.serviceType;
}

function resolveBodyPlacement(submission: BookingSubmission): string | null {
  if (submission.serviceCategory === "other") {
    return null;
  }
  return submission.bodyPlacement;
}

function resolveTattooOnlyRows(
  submission: BookingSubmission,
  strings: LocalizedStrings,
): string {
  if (submission.serviceCategory !== "tattoo") {
    return "";
  }

  const styleRow = buildDetailRow(
    strings.styleLabel,
    submission.preferredStyle !== undefined
      ? resolveTattooStyleLabel(submission.preferredStyle)
      : null,
  );

  const sizeRow = buildDetailRow(strings.sizeLabel, submission.approxSizeCm ?? null);

  const budgetRow = buildDetailRow(
    strings.budgetLabel,
    submission.budgetRange !== undefined
      ? resolveBudgetLabel(submission.budgetRange)
      : null,
  );

  return styleRow + sizeRow + budgetRow;
}

// ---------------------------------------------------------------------------
// Template
// ---------------------------------------------------------------------------

export function buildCustomerConfirmationEmail(
  input: CustomerConfirmationInput,
): EmailTemplate {
  const { customerName, reference, submission, locale: rawLocale } = input;

  const locale = resolveLocale(rawLocale);
  const strings = STRINGS[locale];
  const categoryLabel =
    SERVICE_CATEGORY_LABELS[submission.serviceCategory]?.[locale] ??
    submission.serviceCategory;

  const detailRows = [
    buildDetailRow(strings.referenceLabel, reference),
    buildDetailRow(strings.serviceLabel, categoryLabel),
    buildDetailRow(strings.typeLabel, resolveServiceTypeLabel(submission, locale)),
    buildDetailRow(strings.descriptionLabel, submission.description),
    buildDetailRow(strings.bodyPlacementLabel, resolveBodyPlacement(submission)),
    resolveTattooOnlyRows(submission, strings),
    buildDetailRow(strings.preferredTimesLabel, submission.preferredTimes ?? null),
    buildDetailRow(
      strings.firstTimeLabel,
      submission.isFirstTime ? strings.firstTimeYes : strings.firstTimeNo,
    ),
  ].join("");

  const html = `
<!DOCTYPE html>
<html lang="${locale}">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${strings.subject}</title>
</head>
<body style="margin: 0; padding: 0; background-color: hsl(143, 30%, 6%); font-family: Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: hsl(143, 25%, 9%); padding: 32px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; width: 100%; background-color: hsl(143, 20%, 12%);">

          <!-- Header -->
          <tr>
            <td style="padding: 24px 32px;">
              <span style="color: hsl(143, 3%, 97%); font-family: 'Courier New', monospace; font-size: 20px; font-weight: bold; text-transform: uppercase;">
                TATTOO STATION
              </span>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 32px;">
              <p style="margin: 0 0 8px; font-size: 16px; color: hsl(143, 3%, 97%);">
                ${buildGreeting(locale, customerName)}
              </p>
              <p style="margin: 0 0 24px; font-size: 15px; color: hsl(143, 5%, 70%); line-height: 1.6;">
                ${strings.intro}
              </p>

              <!-- Details table -->
              <table cellpadding="0" cellspacing="0" style="width: 100%; border-top: 2px solid #B01E28; padding-top: 16px; margin-bottom: 24px;">
                <tbody>
                  ${detailRows}
                </tbody>
              </table>

              <p style="margin: 0 0 24px; font-size: 15px; color: hsl(143, 5%, 70%); line-height: 1.6;">
                ${strings.nextSteps}
              </p>

              <p style="margin: 0; font-size: 15px; color: hsl(143, 5%, 70%);">
                ${strings.closing}<br />
                <strong>${strings.signature}</strong>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: hsl(143, 25%, 9%); padding: 16px 32px; text-align: center;">
              <span style="color: hsl(143, 3%, 40%); font-size: 12px;">
                tattoostation.lt
              </span>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return { subject: strings.subject, html };
}