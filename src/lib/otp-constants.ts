/**
 * Shared between server-only OTP logic and client forms, so it lives apart from
 * `@/lib/otp` (which imports `server-only` and cannot be pulled into a bundle).
 */
export const OTP_LENGTH = 6;
export const OTP_TTL_MS = 5 * 60_000;
export const OTP_RESEND_COOLDOWN_SECONDS = 60;
