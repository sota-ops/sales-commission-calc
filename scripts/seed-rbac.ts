import "dotenv/config";
import { seedRbac } from "../src/db/seed-rbac";

seedRbac()
  .then(() => {
    console.log("Done");
    process.exit(0);
  })
  .catch((err) => {
    console.error("Seed failed:", err);
    process.exit(1);
  });
