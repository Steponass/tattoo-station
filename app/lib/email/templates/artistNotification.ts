import { BUDGET_RANGES, TATTOO_STYLES } from "~/lib/booking/bookingConstants";
import type { BookingSubmission } from "~/lib/booking/bookingSubmissionTypes";
import type { EmailTemplate } from "./customerConfirmation";

export type ArtistNotificationInput = {
  artistName: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  reference: string;
  submission: BookingSubmission;
  photoUrls: string[];
};

// ---------------------------------------------------------------------------
// Label resolvers
// ---------------------------------------------------------------------------

const SERVICE_CATEGORY_LABELS: Record<string, string> = {
  tattoo:   "Tattoo",
  piercing: "Piercing",
  other:    "Other",
};

const SERVICE_TYPE_LABELS: Record<string, string> = {
  new:            "New",
  cover_up:       "Cover-up",
  touch_up:       "Touch-up",
  consultation:   "Consultation",
  jewelry_change: "Jewelry change",
};

function resolveBudgetLabel(value: string): string {
  return BUDGET_RANGES.find((range) => range.value === value)?.label ?? value;
}

function resolveTattooStyleLabel(value: string): string {
  return TATTOO_STYLES.find((style) => style.value === value)?.label ?? value;
}

// ---------------------------------------------------------------------------
// Row builder
// ---------------------------------------------------------------------------

function buildDetailRow(label: string, value: string | null | undefined): string {
  if (value === null || value === undefined || value.trim() === "") {
    return "";
  }

  return `
    <tr>
      <td style="padding: 6px 16px 6px 0; color: #888888; white-space: nowrap; vertical-align: top; font-size: 13px;">${label}</td>
      <td style="padding: 6px 0; vertical-align: top; font-size: 13px;">${value}</td>
    </tr>`;
}

// ---------------------------------------------------------------------------
// Section builders
// ---------------------------------------------------------------------------

function buildCustomerSection(input: ArtistNotificationInput): string {
  return `
    <tr>
      <td style="padding: 0 0 24px 0;">
        <p style="margin: 0 0 8px; font-size: 13px; font-weight: bold; color: #B01E28; text-transform: uppercase; letter-spacing: 0.08em;">Customer</p>
        <table cellpadding="0" cellspacing="0" style="width: 100%; border-left: 2px solid #B01E28; padding-left: 12px;">
          <tbody>
            ${buildDetailRow("Name", input.customerName)}
            ${buildDetailRow("Email", input.customerEmail)}
            ${buildDetailRow("Phone", input.customerPhone)}
            ${buildDetailRow("First visit", input.submission.isFirstTime ? "Yes" : "No")}
          </tbody>
        </table>
      </td>
    </tr>`;
}

function buildServiceSection(input: ArtistNotificationInput): string {
  const { submission } = input;

  const categoryLabel =
    SERVICE_CATEGORY_LABELS[submission.serviceCategory] ?? submission.serviceCategory;

  const serviceTypeLabel =
    submission.serviceType !== null
      ? (SERVICE_TYPE_LABELS[submission.serviceType] ?? submission.serviceType)
      : null;

  const bodyPlacement =
    submission.serviceCategory !== "other" ? submission.bodyPlacement : null;

  const styleLabel =
    submission.serviceCategory === "tattoo" && submission.preferredStyle !== undefined
      ? resolveTattooStyleLabel(submission.preferredStyle)
      : null;

  const budgetLabel =
    submission.serviceCategory === "tattoo" && submission.budgetRange !== undefined
      ? resolveBudgetLabel(submission.budgetRange)
      : null;

  const approxSize =
    submission.serviceCategory === "tattoo"
      ? (submission.approxSizeCm ?? null)
      : null;

  return `
    <tr>
      <td style="padding: 0 0 24px 0;">
        <p style="margin: 0 0 8px; font-size: 13px; font-weight: bold; color: #B01E28; text-transform: uppercase; letter-spacing: 0.08em;">Booking details</p>
        <table cellpadding="0" cellspacing="0" style="width: 100%; border-left: 2px solid #B01E28; padding-left: 12px;">
          <tbody>
            ${buildDetailRow("Category", categoryLabel)}
            ${buildDetailRow("Type", serviceTypeLabel)}
            ${buildDetailRow("Placement", bodyPlacement)}
            ${buildDetailRow("Style", styleLabel)}
            ${buildDetailRow("Approx. size", approxSize)}
            ${buildDetailRow("Budget", budgetLabel)}
            ${buildDetailRow("Preferred times", submission.preferredTimes ?? null)}
          </tbody>
        </table>
      </td>
    </tr>`;
}

function buildDescriptionSection(description: string): string {
  return `
    <tr>
      <td style="padding: 0 0 24px 0;">
        <p style="margin: 0 0 8px; font-size: 13px; font-weight: bold; color: #B01E28; text-transform: uppercase; letter-spacing: 0.08em;">Description</p>
        <p style="margin: 0; font-size: 14px; color: #222222; line-height: 1.6; white-space: pre-wrap;">${description}</p>
      </td>
    </tr>`;
}

function buildReferenceLinkSection(referenceLink: string): string {
  return `
    <tr>
      <td style="padding: 0 0 24px 0;">
        <p style="margin: 0 0 8px; font-size: 13px; font-weight: bold; color: #B01E28; text-transform: uppercase; letter-spacing: 0.08em;">Reference link</p>
        <a href="${referenceLink}" style="color: #B01E28; font-size: 14px; word-break: break-all;">${referenceLink}</a>
      </td>
    </tr>`;
}

function buildPhotosSection(photoUrls: string[]): string {
  if (photoUrls.length === 0) {
    return "";
  }

  const photoLinks = photoUrls
    .map(
      (url, index) =>
        `<a href="${url}" style="display: block; color: #B01E28; font-size: 14px; margin-bottom: 6px; word-break: break-all;">Photo ${index + 1}</a>`,
    )
    .join("");

  return `
    <tr>
      <td style="padding: 0 0 24px 0;">
        <p style="margin: 0 0 8px; font-size: 13px; font-weight: bold; color: #B01E28; text-transform: uppercase; letter-spacing: 0.08em;">Reference photos</p>
        ${photoLinks}
      </td>
    </tr>`;
}

// ---------------------------------------------------------------------------
// Template
// ---------------------------------------------------------------------------

export function buildArtistNotificationEmail(
  input: ArtistNotificationInput,
): EmailTemplate {
  const { artistName, reference, submission, photoUrls } = input;

  const subject = `[${reference}] New booking request for you — ${input.customerName}`;

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f5f5f5; font-family: Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 32px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; width: 100%; background-color: #ffffff;">

          <!-- Header -->
          <tr>
            <td style="background-color: #111111; padding: 24px 32px;">
              <span style="color: #B01E28; font-family: 'Courier New', monospace; font-size: 20px; font-weight: bold; letter-spacing: 0.1em; text-transform: uppercase;">
                TATTOO STATION
              </span>
              <span style="color: #888888; font-family: 'Courier New', monospace; font-size: 13px; display: block; margin-top: 4px; letter-spacing: 0.05em;">
                BOOKING REQUEST — ${reference}
              </span>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 32px;">
              <p style="margin: 0 0 24px; font-size: 15px; color: #111111;">
                Hi ${artistName}, you have a new booking request.
              </p>

              <table cellpadding="0" cellspacing="0" style="width: 100%;">
                <tbody>
                  ${buildCustomerSection(input)}
                  ${buildServiceSection(input)}
                  ${buildDescriptionSection(submission.description)}
                  ${submission.referenceLink !== undefined ? buildReferenceLinkSection(submission.referenceLink) : ""}
                  ${buildPhotosSection(photoUrls)}
                </tbody>
              </table>

              <p style="margin: 24px 0 0; font-size: 14px; color: #888888;">
                Reply to this email to contact the customer directly, or reach out via <a href="mailto:info@tattoostation.lt" style="color: #B01E28;">info@tattoostation.lt</a>.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #111111; padding: 16px 32px; text-align: center;">
              <span style="color: #888888; font-size: 12px;">
                tattoostation.lt · artist notification
              </span>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return { subject, html };
}