/**
 * Phone numbers reach us in every shape a parent might type them:
 * "+993 65 123456", "8 65 123456", "65-12-34-56". Everything downstream
 * (OTP lookup, User.phone uniqueness, ExamResult.phone matching) compares
 * numbers as plain digit strings, so normalisation has to happen once, here.
 */

/** Default country calling code — Turkmenistan. */
export const DEFAULT_COUNTRY_CODE = "993";

/**
 * Operator prefixes in service in Turkmenistan: 61-65 are Altyn Asyr (TM Cell)
 * mobile ranges, 71-72 are Turkmentelecom. A number outside this list cannot
 * receive our SMS, so it is rejected at entry rather than after a failed send.
 */
export const OPERATOR_PREFIXES = ["61", "62", "63", "64", "65", "71", "72"] as const;

/** Digits after the operator prefix (e.g. "123456" in 65 123456). */
const SUBSCRIBER_LENGTH = 6;

/** National subscriber number length — operator prefix plus subscriber digits. */
const NATIONAL_LENGTH = 2 + SUBSCRIBER_LENGTH;

/**
 * Reduces any user-typed number to digits only, in international form and
 * without a leading "+". Returns null unless the result is a real Turkmen
 * number: +993, a serviced operator prefix, then exactly six digits.
 */
export function normalizePhone(input: string): string | null {
  const digits = input.replace(/\D/g, "");
  if (!digits) return null;

  // "8 65 123456" — the trunk prefix used locally instead of a country code.
  const withoutTrunk =
    digits.length === NATIONAL_LENGTH + 1 && digits.startsWith("8")
      ? digits.slice(1)
      : digits;

  const national = withoutTrunk.startsWith(DEFAULT_COUNTRY_CODE)
    ? withoutTrunk.slice(DEFAULT_COUNTRY_CODE.length)
    : withoutTrunk;

  if (national.length !== NATIONAL_LENGTH) return null;
  if (!isServicedPrefix(national.slice(0, 2))) return null;

  return `${DEFAULT_COUNTRY_CODE}${national}`;
}

function isServicedPrefix(prefix: string): boolean {
  return (OPERATOR_PREFIXES as readonly string[]).includes(prefix);
}

/**
 * Renders a normalised number back for display: "+993 65 12 34 56".
 * Falls back to a plain "+digits" for numbers outside the default country.
 */
export function formatPhone(normalized: string): string {
  if (normalized.startsWith(DEFAULT_COUNTRY_CODE)) {
    const national = normalized.slice(DEFAULT_COUNTRY_CODE.length);
    if (national.length === NATIONAL_LENGTH) {
      const [, a, b, c, d] = national.match(/^(\d{2})(\d{2})(\d{2})(\d{2})$/)!;
      return `+${DEFAULT_COUNTRY_CODE} ${a} ${b} ${c} ${d}`;
    }
  }
  return `+${normalized}`;
}

/**
 * Masks the middle digits for "code sent to …56" confirmations, keeping the
 * operator prefix and last two digits so a parent can tell which of their
 * numbers the code went to: "+993 65 •• •• 56".
 */
export function maskPhone(normalized: string): string {
  const national = normalized.startsWith(DEFAULT_COUNTRY_CODE)
    ? normalized.slice(DEFAULT_COUNTRY_CODE.length)
    : null;

  if (national?.length === NATIONAL_LENGTH) {
    return `+${DEFAULT_COUNTRY_CODE} ${national.slice(0, 2)} •• •• ${national.slice(-2)}`;
  }
  return `+${normalized.slice(0, 4)} •• •• ${normalized.slice(-2)}`;
}

/**
 * Auth.js needs a unique email on every account, so phone sign-ups get a placeholder.
 * It is an internal id, never an address: never show it or send mail to it.
 */
export const PLACEHOLDER_EMAIL_DOMAIN = "phone.bilim.local";

export function placeholderEmail(phone: string) {
  return `${phone}@${PLACEHOLDER_EMAIL_DOMAIN}`;
}

/** The address worth showing or mailing, or null for a phone account's placeholder. */
export function realEmail(email: string | null | undefined): string | null {
  return email && !email.endsWith(`@${PLACEHOLDER_EMAIL_DOMAIN}`) ? email : null;
}
