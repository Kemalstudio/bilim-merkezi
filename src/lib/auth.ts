import NextAuth from "next-auth";
import type { Role } from "@prisma/client";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { credentialsSchema } from "@/lib/validations/auth";
import { verifyOtpSchema } from "@/lib/validations/phone-auth";
import { verifyOtp } from "@/lib/otp";
import { formatPhone, placeholderEmail } from "@/lib/phone";
import { isGoogleAuthEnabled } from "@/lib/env";

const ROLE_RECHECK_MS = 5 * 60_000;

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [
    ...(isGoogleAuthEnabled
      ? [
          Google({
            clientId: process.env.AUTH_GOOGLE_ID,
            clientSecret: process.env.AUTH_GOOGLE_SECRET,
          }),
        ]
      : []),
    // Phone sign-in. The code has already been sent by `requestOtpAction`;
    // this provider only redeems it. A parent signing in for the first time
    // gets an account created here, so there is no separate phone registration.
    Credentials({
      id: "phone-otp",
      name: "Phone",
      credentials: {
        phone: { label: "Телефон", type: "tel" },
        code: { label: "Код из SMS", type: "text" },
      },
      authorize: async (credentials) => {
        const parsed = verifyOtpSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const { phone, code, name } = parsed.data;
        const result = await verifyOtp(phone, "LOGIN", code);
        if (!result.ok) return null;

        const existing = await prisma.user.findUnique({ where: { phone } });
        const user =
          existing ??
          (await prisma.user.create({
            data: {
              phone,
              name: name ?? formatPhone(phone),
              // Auth.js requires a unique email; phone-only accounts get a
              // placeholder they can replace from account settings.
              email: placeholderEmail(phone),
            },
          }));

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
          role: user.role,
        };
      },
    }),
    Credentials({
      credentials: {
        login: { label: "Email или телефон", type: "text" },
        password: { label: "Пароль", type: "password" },
      },
      authorize: async (credentials) => {
        const parsed = credentialsSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const user = await prisma.user.findUnique({ where: parsed.data.login });
        if (!user?.passwordHash) return null;

        const valid = await bcrypt.compare(parsed.data.password, user.passwordHash);
        if (!valid) return null;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = Boolean(auth?.user);
      const role = auth?.user?.role;
      const isStaff = isLoggedIn && (role === "ADMIN" || role === "MODERATOR");
      const path = nextUrl.pathname;
      const isAdminLogin = path === "/bilim/admin/login";
      const isOnAdmin = path.startsWith("/bilim/admin") && !isAdminLogin;
      const isOnAccount = path.startsWith("/account");

      // The admin panel has its own sign-in page, so strangers go there rather than to /login.
      if (isOnAdmin && !isStaff) {
        const login = new URL("/bilim/admin/login", nextUrl);
        login.searchParams.set("callbackUrl", path);
        return Response.redirect(login);
      }
      if (isAdminLogin && isStaff) {
        return Response.redirect(new URL("/bilim/admin", nextUrl));
      }
      if (isOnAccount) {
        return isLoggedIn;
      }
      return true;
    },
    async jwt({ token, user }) {
      const now = Date.now();
      if (user) {
        token.role = user.role;
        token.roleCheckedAt = now;
        return token;
      }
      // The role lives in a long-lived token, so it is re-read now and then: a demoted
      // moderator loses the admin panel within minutes, and a deleted account is signed out.
      const checkedAt = typeof token.roleCheckedAt === "number" ? token.roleCheckedAt : 0;
      if (now - checkedAt > ROLE_RECHECK_MS) {
        if (!token.sub) return null;
        const current = await prisma.user.findUnique({ where: { id: token.sub }, select: { role: true } });
        if (!current) return null;
        token.role = current.role;
        token.roleCheckedAt = now;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub!;
        session.user.role = token.role as Role;
      }
      return session;
    },
  },
});
