import { closeDb } from "../src/db";
import { seedSampleFoods } from "./seed-sample-foods";
import { seedUsers } from "./seed-users";

async function main() {
  await seedUsers();
  await seedSampleFoods();
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(closeDb);
