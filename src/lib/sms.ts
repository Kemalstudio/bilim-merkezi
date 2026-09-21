import "server-only";

/**
 * SMS delivery.
 *
 * No SMS gateway is wired up yet — the operators available in Turkmenistan are
 * contract-based and region-specific, so the concrete transport is a deployment
 * decision. Everything above this module talks to `sendSms` only, so switching
 * to a real provider means implementing one function and nothing else.
 *
 * Until `SMS_PROVIDER=http` is configured, codes are written to the server log
 * so the phone sign-in flow is fully testable in development.
 */

export type SmsMessage = {
  to: string;
  text: string;
};

export type SmsResult = { delivered: boolean; transport: "console" | "http" };

async function sendViaHttpGateway(message: SmsMessage): Promise<SmsResult> {
  const url = process.env.SMS_GATEWAY_URL;
  const token = process.env.SMS_GATEWAY_TOKEN;
  if (!url) throw new Error("SMS_GATEWAY_URL is not configured");

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({
      to: `+${message.to}`,
      text: message.text,
      sender: process.env.SMS_SENDER_ID ?? "BilimMerkezi",
    }),
  });

  if (!response.ok) {
    throw new Error(`SMS gateway responded ${response.status}`);
  }
  return { delivered: true, transport: "http" };
}

function sendViaConsole(message: SmsMessage): SmsResult {
  console.info(`\n[sms → +${message.to}] ${message.text}\n`);
  return { delivered: true, transport: "console" };
}

export async function sendSms(message: SmsMessage): Promise<SmsResult> {
  if (process.env.SMS_PROVIDER === "http") {
    return sendViaHttpGateway(message);
  }
  return sendViaConsole(message);
}

/** True when codes only reach the server log, so the UI can say so in dev. */
export const isSmsSimulated = process.env.SMS_PROVIDER !== "http" && process.env.SMS_PROVIDER !== "otp-gateway";
