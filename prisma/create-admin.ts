import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

/**
 * Creates the admin account for /bilim/admin, or resets its password and role if it exists.
 * The credentials come from the environment so they never end up in the repository:
 *
 *   ADMIN_EMAIL=… ADMIN_PASSWORD=… npm run admin:create
 */
async function main() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) throw new Error("Set ADMIN_EMAIL and ADMIN_PASSWORD");
  if (password.length < 8) throw new Error("ADMIN_PASSWORD must be at least 8 characters");

  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });
  try {
    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.user.upsert({
      where: { email },
      update: { passwordHash, role: "ADMIN" },
      create: { email, name: "Администратор Bilim", passwordHash, role: "ADMIN" },
    });
    console.log(`Admin ready: ${user.email} (${user.role})`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
