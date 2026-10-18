import { getFeed } from "@/lib/mobile/data";
import { ok, withMobileUser } from "@/lib/mobile/http";

/** The parent's recent events; the app keeps "seen up to" on the phone for the unread badge. */
export const GET = withMobileUser(async ({ user }) => ok(await getFeed(user.id)));
