import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: env("DATABASE_URL"),
    // Prisma needs a throwaway database to replay the migration history against
    // when it diffs or validates migrations. Never holds real data.
    shadowDatabaseUrl: env("SHADOW_DATABASE_URL"),
  },
});
