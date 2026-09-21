import "server-only";

import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { prisma } from "@/lib/prisma";
import { MIME_BY_EXT } from "@/lib/file-signature";
import { amzDateOf, encodeSegment, sha256Hex, signV4 } from "@/lib/storage/sigv4";

/**
 * Where uploaded files live, chosen by STORAGE_DRIVER:
 *
 * - `local` (default) — the server's disk, in the same folders as before (public/uploads and
 *   private-uploads). Right for one server with a persistent disk.
 * - `database` — Postgres (`stored_files`). Works on any number of servers and on hosts
 *   without a persistent disk, with no extra service; fine for images and documents of a few MB.
 * - `s3` — any S3-compatible bucket (S3_ENDPOINT, S3_REGION, S3_BUCKET, S3_ACCESS_KEY_ID,
 *   S3_SECRET_ACCESS_KEY). The bucket stays private; files are served through /files.
 *
 * Keys look like "covers/<uuid>.png". Enrollment documents live under "documents/" and are
 * never served publicly — only through /api/documents with an ownership check.
 */

export type Namespace = "covers" | "library" | "documents" | "avatars";
export const PUBLIC_NAMESPACES: readonly Namespace[] = ["covers", "library", "avatars"];

export type StoredObject = { bytes: Buffer; contentType: string };

type Driver = {
  put(key: string, bytes: Buffer, contentType: string): Promise<void>;
  get(key: string): Promise<StoredObject | null>;
  /** The URL the site links to for a public file. */
  url(key: string): string;
};

const contentTypeOf = (key: string) => MIME_BY_EXT[key.split(".").pop()?.toLowerCase() ?? ""] ?? "application/octet-stream";

/** Keys we generate are "<namespace>/<uuid>.<ext>"; anything else is refused before any I/O. */
export function isValidKey(key: string) {
  return /^(covers|library|documents|avatars)\/[a-f0-9-]{36}\.[a-z0-9]{2,5}$/i.test(key);
}

/* ── local disk ───────────────────────────────────────────────────────────────────── */

const LOCAL_DIRS: Record<Namespace, string> = {
  covers: path.join(process.cwd(), "public", "uploads"),
  library: path.join(process.cwd(), "public", "uploads", "library"),
  avatars: path.join(process.cwd(), "public", "uploads", "avatars"),
  documents: path.join(process.cwd(), "private-uploads", "enrollment-documents"),
};

const localFile = (key: string) => {
  const [namespace, file] = key.split("/") as [Namespace, string];
  return { dir: LOCAL_DIRS[namespace], file };
};

const localDriver: Driver = {
  async put(key, bytes) {
    const { dir, file } = localFile(key);
    await mkdir(dir, { recursive: true });
    await writeFile(path.join(dir, file), bytes);
  },
  async get(key) {
    const { dir, file } = localFile(key);
    try {
      return { bytes: await readFile(path.join(dir, file)), contentType: contentTypeOf(key) };
    } catch {
      return null;
    }
  },
  // The same public URLs the site has always used, served straight from /public.
  url(key) {
    const { file } = localFile(key);
    if (key.startsWith("library/")) return `/uploads/library/${file}`;
    if (key.startsWith("avatars/")) return `/uploads/avatars/${file}`;
    return `/uploads/${file}`;
  },
};

/* ── database ─────────────────────────────────────────────────────────────────────── */

const databaseDriver: Driver = {
  async put(key, bytes, contentType) {
    const data = new Uint8Array(bytes);
    await prisma.storedFile.upsert({
      where: { key },
      create: { key, contentType, size: bytes.length, data },
      update: { contentType, size: bytes.length, data },
    });
  },
  async get(key) {
    const row = await prisma.storedFile.findUnique({ where: { key } });
    return row ? { bytes: Buffer.from(row.data), contentType: row.contentType } : null;
  },
  url: (key) => `/files/${key}`,
};

/* ── S3-compatible ────────────────────────────────────────────────────────────────── */

function s3Config() {
  const { S3_ENDPOINT, S3_REGION, S3_BUCKET, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY } = process.env;
  if (!S3_ENDPOINT || !S3_BUCKET || !S3_ACCESS_KEY_ID || !S3_SECRET_ACCESS_KEY) {
    throw new Error("S3 storage needs S3_ENDPOINT, S3_BUCKET, S3_ACCESS_KEY_ID and S3_SECRET_ACCESS_KEY");
  }
  return {
    endpoint: new URL(S3_ENDPOINT),
    region: S3_REGION || "us-east-1",
    bucket: S3_BUCKET,
    accessKeyId: S3_ACCESS_KEY_ID,
    secretAccessKey: S3_SECRET_ACCESS_KEY,
  };
}

async function s3Request(method: "GET" | "PUT", key: string, body?: Buffer, contentType?: string) {
  const config = s3Config();
  // Path-style addressing works with every S3-compatible provider.
  const objectPath = `/${encodeSegment(config.bucket)}/${key.split("/").map(encodeSegment).join("/")}`;
  const payloadHash = body ? sha256Hex(body) : sha256Hex("");
  const headers: Record<string, string> = {
    host: config.endpoint.host,
    "x-amz-date": amzDateOf(new Date()),
    "x-amz-content-sha256": payloadHash,
    ...(contentType ? { "content-type": contentType } : {}),
  };
  const { authorization } = signV4({ method, path: objectPath, headers, payloadHash, ...config });

  return fetch(new URL(objectPath, config.endpoint), {
    method,
    headers: { ...headers, authorization },
    body: body ? new Uint8Array(body) : undefined,
    signal: AbortSignal.timeout(20_000),
  });
}

const s3Driver: Driver = {
  async put(key, bytes, contentType) {
    const response = await s3Request("PUT", key, bytes, contentType);
    if (!response.ok) throw new Error(`S3 PUT ${key} failed: ${response.status} ${await response.text()}`);
  },
  async get(key) {
    const response = await s3Request("GET", key);
    if (response.status === 404) return null;
    if (!response.ok) throw new Error(`S3 GET ${key} failed: ${response.status}`);
    return {
      bytes: Buffer.from(await response.arrayBuffer()),
      contentType: response.headers.get("content-type") ?? contentTypeOf(key),
    };
  },
  url: (key) => `/files/${key}`,
};

export function getStorage(): Driver {
  switch (process.env.STORAGE_DRIVER) {
    case "database":
      return databaseDriver;
    case "s3":
      return s3Driver;
    default:
      return localDriver;
  }
}

/** Saves a verified upload under `namespace` and returns its key and public URL. */
export async function saveUpload(namespace: Namespace, bytes: Buffer, ext: string, contentType: string) {
  const key = `${namespace}/${crypto.randomUUID()}.${ext}`;
  const storage = getStorage();
  await storage.put(key, bytes, contentType);
  return { key, file: key.slice(namespace.length + 1), url: storage.url(key) };
}
