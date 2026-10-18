import { getContacts, getLanguages } from "@/lib/site-settings";
import { ok, publicRoute } from "@/lib/mobile/http";

/** Centre details edited in the admin panel (contacts, languages), for the app's help screens. */
export const GET = publicRoute(async () => {
  const [contacts, languages] = await Promise.all([getContacts(), getLanguages()]);
  return ok({ contacts, languages: { enabled: languages.enabled, defaultLocale: languages.defaultLocale } });
});
