import "server-only";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";

/**
 * Fixed-window rate limiting with a store chosen by RATE_LIMIT_STORE:
 *
 * - `database` (default) — a counter row in Postgres. Every app server shares it, so limits
 *   hold when the site runs on several instances, and no extra service is needed.
 * - `upstash` — Upstash Redis over its REST API (UPSTASH_REDIS_REST_URL / _TOKEN), for hosts
 *   where a request-per-attempt write to Postgres is unwanted.
 * - `memory` — per-process map; fine for local development and single-instance deploys.
 *
 * If the shared store fails, the limiter falls back to memory rather than locking people out.
 */

export type RateLimitResult = { success: boolean };

type Store = (key: string, windowMs: number) => Promise<number>;

const buckets = new Map<string, { count: number; resetAt: number }>();
let memoryCalls = 0;

const memoryStore: Store = async (key, windowMs) => {
  const now = Date.now();
  // Expired buckets are dropped now and then, so keys from one-off visitors do not pile up.
  if (++memoryCalls % 500 === 0) {
    for (const [bucketKey, bucket] of buckets) if (bucket.resetAt < now) buckets.delete(bucketKey);
  }
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return 1;
  }
  bucket.count += 1;
  return bucket.count;
};

const databaseStore: Store = async (key, windowMs) => {
  // One statement: a fresh or expired window starts at 1, a live one is incremented.
  const rows = await prisma.$queryRaw<{ count: number }[]>`
    INSERT INTO "rate_limits" ("key", "count", "resetAt")
    VALUES (${key}, 1, NOW() + make_interval(secs => ${windowMs / 1000}::double precision))
    ON CONFLICT ("key") DO UPDATE SET
      "count" = CASE WHEN "rate_limits"."resetAt" < NOW() THEN 1 ELSE "rate_limits"."count" + 1 END,
      "resetAt" = CASE WHEN "rate_limits"."resetAt" < NOW() THEN EXCLUDED."resetAt" ELSE "rate_limits"."resetAt" END
    RETURNING "count"`;

  // Roughly one call in two hundred clears windows that ended over an hour ago.
  if (Math.random() < 0.005) {
    prisma.$executeRaw`DELETE FROM "rate_limits" WHERE "resetAt" < NOW() - INTERVAL '1 hour'`.catch(() => null);
  }
  return Number(rows[0]?.count ?? 1);
};

const upstashStore: Store = async (key, windowMs) => {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) throw new Error("UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN are not set");
  const response = await fetch(`${url.replace(/\/$/, "")}/pipeline`, {
    method: "POST",
    headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
    body: JSON.stringify([
      ["INCR", `rl:${key}`],
      ["PEXPIRE", `rl:${key}`, String(windowMs), "NX"],
    ]),
    signal: AbortSignal.timeout(2000),
  });
  if (!response.ok) throw new Error(`Upstash responded ${response.status}`);
  const [incr] = (await response.json()) as { result: number }[];
  return Number(incr.result);
};

function selectStore(): Store {
  switch (process.env.RATE_LIMIT_STORE) {
    case "memory":
      return memoryStore;
    case "upstash":
      return upstashStore;
    default:
      return databaseStore;
  }
}

let warned = false;

export async function rateLimit(key: string, limit: number, windowMs: number): Promise<RateLimitResult> {
  const store = selectStore();
  let count: number;
  try {
    count = await store(key, windowMs);
  } catch (error) {
    if (!warned) {
      console.error("[rate-limit] shared store failed, using in-memory counters", error);
      warned = true;
    }
    count = await memoryStore(key, windowMs);
  }
  return { success: count <= limit };
}

/**
 * The caller's address for rate limiting. Only the first `x-forwarded-for` hop is used:
 * keying on the whole header let a client mint a fresh bucket per request by appending junk.
 * Behind a reverse proxy, make sure the proxy overwrites (not appends to) this header.
 */
export async function getClientIp() {
  const store = await headers();
  const forwarded = store.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || store.get("x-real-ip")?.trim() || "unknown";
}
