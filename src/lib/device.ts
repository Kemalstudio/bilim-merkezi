/**
 * A short, human label for a browser: "Chrome · Windows". Only what a parent needs to tell
 * their own sign-ins from a stranger's — no version numbers, no fingerprinting.
 */
export function describeDevice(userAgent: string | null | undefined): string | null {
  if (!userAgent) return null;

  // Order matters: Edge and Opera also say "Chrome", Chrome also says "Safari".
  const browser =
    /Edg(e|A|iOS)?\//.test(userAgent) ? "Edge"
    : /OPR\/|Opera/.test(userAgent) ? "Opera"
    : /YaBrowser/.test(userAgent) ? "Yandex"
    : /Firefox|FxiOS/.test(userAgent) ? "Firefox"
    : /Chrome|CriOS/.test(userAgent) ? "Chrome"
    : /Safari/.test(userAgent) ? "Safari"
    : null;

  // iOS and Android before macOS/Linux: an iPhone says "like Mac OS X", Android says "Linux".
  const system =
    /iPhone|iPad|iPod/.test(userAgent) ? "iOS"
    : /Android/.test(userAgent) ? "Android"
    : /Windows/.test(userAgent) ? "Windows"
    : /Mac OS X|Macintosh/.test(userAgent) ? "macOS"
    : /CrOS/.test(userAgent) ? "ChromeOS"
    : /Linux/.test(userAgent) ? "Linux"
    : null;

  return [browser, system].filter(Boolean).join(" · ") || null;
}
