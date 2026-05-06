import { closeDb, getDb } from "../src/db";
import { sql } from "drizzle-orm";

async function main() {
  if (process.env.CONFIRM_DB_RESET !== "homeplate") {
    throw new Error(
      "Refusing to reset the database. Re-run with CONFIRM_DB_RESET=homeplate for local-only reset.",
    );
  }

  const databaseUrl = process.env.DATABASE_URL ?? "";
  if (!databaseUrl.includes("localhost") && !databaseUrl.includes("127.0.0.1")) {
    throw new Error("Refusing to reset a non-local database URL.");
  }

  await getDb().execute(sql`drop schema public cascade`);
  await getDb().execute(sql`create schema public`);
  console.log("Local database schema reset. Run pnpm db:migrate && pnpm db:seed next.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(closeDb);
