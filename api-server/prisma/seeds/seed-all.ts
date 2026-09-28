import { execSync } from "child_process";

const seeds = [
  { file: "prisma/seeds/01-core/seed.ts", required: true },
  { file: "prisma/seeds/02-sports/seed-events.ts", required: false },
  { file: "prisma/seeds/02-sports/seed-events-expanded.ts", required: false },
  { file: "prisma/seeds/03-marketplace/seed-marketplace.ts", required: false },
  { file: "prisma/seeds/04-affiliate/seed-affiliate.ts", required: false },
  { file: "prisma/seeds/04-affiliate/seed-commissions.ts", required: false },
  { file: "prisma/seeds/05-profiles/seed-achievements.ts", required: false },
  { file: "prisma/seeds/06-realistic/seed-website-info.ts", required: false },
  { file: "prisma/seeds/06-realistic/seed-interconnected.ts", required: false },
  { file: "prisma/seeds/07-testing/seed-reviews.ts", required: false },
  { file: "prisma/seeds/07-testing/seed-orders.ts", required: false },
  { file: "prisma/seeds/07-testing/seed-match-events.ts", required: false },
  { file: "prisma/seeds/07-testing/seed-assignments.ts", required: false },
  { file: "prisma/seeds/07-testing/seed-2fa-oauth.ts", required: false },
];

const tsNodeOpts = "--project tsconfig.seed.json --transpile-only";
let failed = false;

for (const seed of seeds) {
  console.log(`\n=== Running: ${seed.file} ===`);
  try {
    execSync(`npx ts-node ${tsNodeOpts} ${seed.file}`, {
      stdio: "inherit",
    });
  } catch (err: any) {
    console.error(`  ❌ FAILED: ${seed.file}`);
    if (seed.required) {
      console.error("  🛑 Required seed failed — aborting.");
      process.exit(1);
    }
    failed = true;
  }
}

console.log(
  failed
    ? "\n=== Seeds completed with some failures ==="
    : "\n=== All seeds completed successfully ==="
);
