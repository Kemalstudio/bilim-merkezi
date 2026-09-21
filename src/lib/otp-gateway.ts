import "server-only";

/**
 * Client for our own SMS OTP gateway (the `sms-otp-panel` project).
 *
 * Unlike a plain SMS transport, the gateway generates, sends and checks the
 * code itself: `send` returns an `otp_id`, and `verify` takes that id plus the
 * code the visitor typed. So in this mode no code ever exists on our side —
 * `PhoneOtp` only remembers which gateway id belongs to which number.
 *
 * Enabled with `SMS_PROVIDER="otp-gateway"`; see `.env.example`.
 */

export const isOtpGatewayEnabled = process.env.SMS_PROVIDER === "otp-gateway";

const REQUEST_TIMEOUT_MS = 10_000;

export type GatewaySendResult =
  | { ok: true; otpId: string }
  | { ok: false; reason: "rate_limited"; retryInSeconds: number }
  | { ok: false; reason: "unavailable" };

export type GatewayVerifyResult =
  | { ok: true }
  | { ok: false; reason: "invalid"; attemptsLeft: number }
  | { ok: false; reason: "expired" | "locked" };

async function call(path: string, body: unknown): Promise<{ status: number; data: Record<string, unknown> }> {
  const baseUrl = process.env.OTP_GATEWAY_URL?.replace(/\/+$/, "");
  const apiKey = process.env.OTP_GATEWAY_API_KEY;
  if (!baseUrl || !apiKey) throw new Error("OTP_GATEWAY_URL and OTP_GATEWAY_API_KEY must be configured");

  const response = await fetch(`${baseUrl}/api/v1/${path}`, {
    method: "POST",
    headers: { "content-type": "application/json", accept: "application/json", "x-api-key": apiKey },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    cache: "no-store",
  });
  const data = (await response.json().catch(() => ({}))) as Record<string, unknown>;
  return { status: response.status, data };
}

function retryAfter(data: Record<string, unknown>): number {
  const seconds = Number(data.retry_after);
  return Number.isFinite(seconds) && seconds > 0 ? Math.ceil(seconds) : 60;
}

/**
 * `phone` is our normalised form ("99365123456"); the gateway wants "+993XXXXXXXX".
 * `message` is the SMS text with a single `{code}` placeholder the gateway fills in.
 */
export async function gatewaySendOtp(phone: string, message: string): Promise<GatewaySendResult> {
  try {
    const from = process.env.OTP_GATEWAY_FROM || undefined;
    const { status, data } = await call("otp/send", { phone: `+${phone}`, message, ...(from ? { from } : {}) });

    if (status === 202 && data.otp_id != null) return { ok: true, otpId: String(data.otp_id) };
    if (status === 429) return { ok: false, reason: "rate_limited", retryInSeconds: retryAfter(data) };

    console.error(`[otp-gateway] send failed: ${status} ${JSON.stringify(data)}`);
    return { ok: false, reason: "unavailable" };
  } catch (error) {
    console.error("[otp-gateway] send failed:", error);
    return { ok: false, reason: "unavailable" };
  }
}

/**
 * Network or server failures are thrown rather than reported as a wrong code:
 * the visitor's code may well be right, and burning an attempt for our outage
 * would be unfair.
 */
export async function gatewayVerifyOtp(otpId: string, code: string): Promise<GatewayVerifyResult> {
  const { status, data } = await call("otp/verify", { otp_id: Number(otpId), code });

  if (status === 200 && data.verified === true) return { ok: true };
  if (status === 200) {
    const attemptsLeft = Number(data.attempts_left ?? 0);
    return attemptsLeft > 0 ? { ok: false, reason: "invalid", attemptsLeft } : { ok: false, reason: "locked" };
  }
  if (status === 429) return { ok: false, reason: "locked" };
  // 410 expired / already verified, 404 unknown id: either way there is nothing left to redeem.
  if (status === 410 || status === 404) return { ok: false, reason: "expired" };

  throw new Error(`OTP gateway verify responded ${status}: ${JSON.stringify(data)}`);
}
