type Bucket = { count: number; resetAt: number };

// In-memory limiter: fine for a single server instance. A multi-instance
// production deploy should swap this for a shared store (e.g. Upstash Redis).
const buckets = new Map<string, Bucket>();

export function rateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { success: true };
  }
  if (bucket.count >= limit) {
    return { success: false };
  }
  bucket.count += 1;
  return { success: true };
}
