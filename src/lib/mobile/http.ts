import "server-only";

import { NextResponse } from "next/server";
import { defaultLocale, isLocale, type Locale } from "@/lib/i18n/config";
import { getUiDictionary, issueText, type Ui } from "@/lib/i18n/ui";
import { getLanguages } from "@/lib/site-settings";
import { authenticateMobile, type MobileUser } from "@/lib/mobile/session";

/*
 * Plumbing shared by the mobile app's JSON API (/api/mobile/v1). Every error has the same
 * shape — { error: "text for the parent", code?: "machine_readable" } — and the text is in the
 * language the app asks for with the X-Locale header.
 */

export type ApiContext = { t: Ui; locale: Locale; ip: string };

export async function apiContext(request: Request): Promise<ApiContext> {
  const languages = await getLanguages();
  const asked = request.headers.get("x-locale") ?? request.headers.get("accept-language")?.slice(0, 2);
  const locale = isLocale(asked) && languages.enabled.includes(asked) ? asked : (languages.defaultLocale ?? defaultLocale);
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip")?.trim() || "unknown";
  return { t: getUiDictionary(locale), locale, ip };
}

export function ok<T>(data: T, status = 200) {
  return NextResponse.json(data, { status, headers: { "cache-control": "no-store" } });
}

export function fail(error: string, status = 400, code?: string) {
  return NextResponse.json({ error, ...(code ? { code } : {}) }, { status, headers: { "cache-control": "no-store" } });
}

/** A zod failure as a 400 in the parent's language. */
export function invalid(t: Ui, issues: readonly { message: string }[]) {
  return fail(issueText(t, issues), 400, "invalid");
}

/** The JSON body as a plain object; anything else (bad JSON, an array) reads as empty. */
export async function readJson(request: Request): Promise<Record<string, unknown>> {
  try {
    const body = await request.json();
    return body && typeof body === "object" && !Array.isArray(body) ? (body as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

type Handler<P> = (input: { request: Request; user: MobileUser; ctx: ApiContext; params: P }) => Promise<Response>;

/** Wraps a route that needs a signed-in parent: 401 without a valid token, 500 on a crash. */
export function withMobileUser<P = Record<string, never>>(handler: Handler<P>) {
  return async (request: Request, route: { params: Promise<P> }) => {
    const ctx = await apiContext(request);
    const user = await authenticateMobile(request);
    if (!user) return fail(ctx.t.errors.signInRequired, 401, "unauthorized");
    try {
      return await handler({ request, user, ctx, params: await route.params });
    } catch (error) {
      console.error("[mobile api]", request.method, new URL(request.url).pathname, error);
      return fail(ctx.t.errors.serverError, 500, "server_error");
    }
  };
}

/** Wraps a route open to anyone (sign-in, catalogue), with the same crash handling. */
export function publicRoute<P = Record<string, never>>(
  handler: (input: { request: Request; ctx: ApiContext; params: P }) => Promise<Response>
) {
  return async (request: Request, route: { params: Promise<P> }) => {
    const ctx = await apiContext(request);
    try {
      return await handler({ request, ctx, params: await route.params });
    } catch (error) {
      console.error("[mobile api]", request.method, new URL(request.url).pathname, error);
      return fail(ctx.t.errors.serverError, 500, "server_error");
    }
  };
}
