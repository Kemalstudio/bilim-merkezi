import { createHash, createHmac } from "node:crypto";

/**
 * AWS Signature Version 4 for S3-compatible storage (AWS S3, Cloudflare R2, MinIO, Yandex
 * Object Storage…). Pure functions, so the signing can be checked against AWS's published
 * example in tests without any network.
 */

export const EMPTY_PAYLOAD_HASH = "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855";

export function sha256Hex(data: string | Uint8Array) {
  return createHash("sha256").update(data).digest("hex");
}

function hmac(key: string | Buffer, data: string) {
  return createHmac("sha256", key).update(data).digest();
}

/** RFC 3986 encoding of one path segment, as S3 expects it. */
export function encodeSegment(segment: string) {
  return encodeURIComponent(segment).replace(/[!'()*]/g, (char) => `%${char.charCodeAt(0).toString(16).toUpperCase()}`);
}

export type SignInput = {
  method: string;
  /** Already-encoded path, e.g. "/bucket/covers/a.png". */
  path: string;
  /** Header names in any case; `host`, `x-amz-date` and `x-amz-content-sha256` must be present. */
  headers: Record<string, string>;
  payloadHash: string;
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
  service?: string;
};

export function signV4({ method, path, headers, payloadHash, region, accessKeyId, secretAccessKey, service = "s3" }: SignInput) {
  const normalized = Object.entries(headers)
    .map(([name, value]) => [name.toLowerCase(), value.trim().replace(/\s+/g, " ")] as const)
    .sort(([a], [b]) => (a < b ? -1 : 1));
  const amzDate = normalized.find(([name]) => name === "x-amz-date")?.[1];
  if (!amzDate) throw new Error("x-amz-date header is required");
  const dateStamp = amzDate.slice(0, 8);

  const canonicalHeaders = normalized.map(([name, value]) => `${name}:${value}\n`).join("");
  const signedHeaders = normalized.map(([name]) => name).join(";");
  const canonicalRequest = [method, path, "", canonicalHeaders, signedHeaders, payloadHash].join("\n");

  const scope = `${dateStamp}/${region}/${service}/aws4_request`;
  const stringToSign = ["AWS4-HMAC-SHA256", amzDate, scope, sha256Hex(canonicalRequest)].join("\n");

  const signingKey = hmac(hmac(hmac(hmac(`AWS4${secretAccessKey}`, dateStamp), region), service), "aws4_request");
  const signature = createHmac("sha256", signingKey).update(stringToSign).digest("hex");

  return {
    signature,
    authorization: `AWS4-HMAC-SHA256 Credential=${accessKeyId}/${scope}, SignedHeaders=${signedHeaders}, Signature=${signature}`,
  };
}

/** "20130524T000000Z" */
export function amzDateOf(date: Date) {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}
