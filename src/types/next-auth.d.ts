import type { Role } from "@prisma/client";
import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: Role;
    } & DefaultSession["user"];
  }

  interface User {
    role: Role;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: Role;
    /** When the role was last read from the database (ms since epoch). */
    roleCheckedAt?: number;
    /** When this session signed in (ms since epoch); a password reset after it ends the session. */
    authAt?: number;
  }
}
