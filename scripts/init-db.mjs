// Applies db/schema.sql to the database at process.env.DATABASE_URL.
// Usage: DATABASE_URL="postgresql://..." npm run db:init
// (Next.js also loads .env / .env.local automatically when run via `next`,
// but this is a plain node script, so make sure DATABASE_URL is set in your shell.)

import { neon } from "@neondatabase/serverless";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error(
      "DATABASE_URL is not set. Export it or run:\n  DATABASE_URL=... npm run db:init"
    );
    process.exit(1);
  }

  const sql = neon(url);
  const schemaPath = join(__dirname, "..", "db", "schema.sql");
  const schema = readFileSync(schemaPath, "utf8");

  // Split on semicolons that end a statement (schema.sql has no semicolons
  // inside strings/functions, so a simple split is safe here).
  const statements = schema
    .split(";")
    .map((s) => s.trim())
    .filter(Boolean);

  console.log(`Applying ${statements.length} statement(s) to the database...`);
  for (const statement of statements) {
    await sql.query(statement);
  }
  console.log("Done. Tables feedback_responses and bug_reports are ready.");
}

main().catch((err) => {
  console.error("Failed to initialize database:", err);
  process.exit(1);
});
