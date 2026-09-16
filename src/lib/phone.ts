/**
 * Phone numbers reach us in every shape a parent might type them:
 * "+993 65 123456", "8 65 123456", "65-12-34-56". Everything downstream
 * (OTP lookup, User.phone uniqueness, ExamResult.phone matching) compares
 * numbers as plain digit strings, so normalisation has to happen once, here.
 */

/** Default country calling code — Turkmenistan. */
export const DEFAULT_COUNTRY_CODE = "993";

/** National subscriber number length for the default country (e.g. 65123456). */
const NATIONAL_LENGTH = 8;

/**
 * Reduces any user-typed number to digits only, in international form and
 * without a leading "+". Returns null when the input cannot be a real number.
 */
export function normalizePhone(input: string): string | null {
  const digits = input.replace(/\D/g, "");
  if (!digits) return null;

  // "8 65 123456" — the trunk prefix used locally instead of a country code.
  const withoutTrunk =
    digits.length === NATIONAL_LENGTH + 1 && digits.startsWith("8")
      ? digits.slice(1)
      : digits;

  const full =
    withoutTrunk.length === NATIONAL_LENGTH
      ? `${DEFAULT_COUNTRY_CODE}${withoutTrunk}`
      : withoutTrunk;

  // Shortest plausible international number is 8 digits; E.164 caps at 15.
  if (full.length < 8 || full.length > 15) return null;
  return full;
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

/** Masks all but the last two digits, for "code sent to …56" confirmations. */
export function maskPhone(normalized: string): string {
  const visible = normalized.slice(-2);
  return `+${normalized.slice(0, 4)} •• •• ${visible}`;
}
