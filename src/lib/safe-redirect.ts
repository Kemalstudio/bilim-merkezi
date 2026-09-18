/**
 * A same-site path to send the user to after sign-in, or `fallback`.
 * "//evil.com" and "/\evil.com" start with "/" too, but browsers read them as another host.
 */
export function safeCallbackUrl(value: unknown, fallback: string, requiredPrefix = "/") {
  if (typeof value !== "string") return fallback;
  if (!value.startsWith("/") || value.startsWith("//") || value.includes("\\")) return fallback;
  return value.startsWith(requiredPrefix) ? value : fallback;
}
