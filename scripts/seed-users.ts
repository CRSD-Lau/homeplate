import { eq } from "drizzle-orm";

import { closeDb, getDb } from "../src/db";
import { userProfiles, userSettings, users } from "../src/db/schema";
import { hashPassword } from "../src/lib/auth/passwords";
import { requireEnv } from "./load-env";

type SeedUser = {
  email: string;
  password: string;
  displayName: string;
  role: "admin" | "user";
};

export async function seedUsers() {
  const neilEmail = requireEnv("SEED_NEIL_EMAIL").toLowerCase();
  const allisonEmail = requireEnv("SEED_ALLISON_EMAIL").toLowerCase();
  const adminEmail = requireEnv("ADMIN_EMAIL").toLowerCase();

  if (adminEmail !== neilEmail) {
    throw new Error("ADMIN_EMAIL should match SEED_NEIL_EMAIL for the Phase 1 Neil admin seed.");
  }

  const seedUsers: SeedUser[] = [
    {
      email: neilEmail,
      password: requireEnv("SEED_NEIL_PASSWORD"),
      displayName: "Neil",
      role: "admin",
    },
    {
      email: allisonEmail,
      password: requireEnv("SEED_ALLISON_PASSWORD"),
      displayName: "Allison",
      role: "user",
    },
  ];

  for (const seedUser of seedUsers) {
    const [existing] = await getDb()
      .select()
      .from(users)
      .where(eq(users.email, seedUser.email))
      .limit(1);

    const passwordHash = await hashPassword(seedUser.password);
    const [user] = existing
      ? await getDb()
          .update(users)
          .set({
            displayName: seedUser.displayName,
            passwordHash,
            role: seedUser.role,
            updatedAt: new Date(),
          })
          .where(eq(users.id, existing.id))
          .returning()
      : await getDb()
          .insert(users)
          .values({
            email: seedUser.email,
            displayName: seedUser.displayName,
            passwordHash,
            role: seedUser.role,
          })
          .returning();

    await getDb()
      .insert(userProfiles)
      .values({
        userId: user.id,
        displayName: seedUser.displayName,
      })
      .onConflictDoUpdate({
        target: userProfiles.userId,
        set: {
          displayName: seedUser.displayName,
          updatedAt: new Date(),
        },
      });

    await getDb()
      .insert(userSettings)
      .values({
        userId: user.id,
        weightUnit: "lb",
        heightUnit: "cm",
        waterUnit: "ml",
        bloodGlucoseUnit: "mmol_l",
        dailyWaterGoalMl: 2500,
      })
      .onConflictDoNothing({ target: userSettings.userId });
  }

  console.log("Seeded Neil and Allison.");
}

if (import.meta.url === `file://${process.argv[1].replaceAll("\\", "/")}`) {
  seedUsers()
    .catch((error) => {
      console.error(error);
      process.exitCode = 1;
    })
    .finally(closeDb);
}
