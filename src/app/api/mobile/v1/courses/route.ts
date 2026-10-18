import { getCatalog } from "@/lib/mobile/data";
import { ok, publicRoute } from "@/lib/mobile/http";

/** The published catalogue; open to visitors, so the app can show courses before sign-in. */
export const GET = publicRoute(async () => ok(await getCatalog()));
