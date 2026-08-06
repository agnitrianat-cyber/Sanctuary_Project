// Creates the schema and loads sample data into Neon.
// Usage: npm run db:setup   (reads DATABASE_URL from .env.local via Node's --env-file)
import { readFileSync } from "node:fs";
import { neon } from "@neondatabase/serverless";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is not set. Put it in .env.local (see .env.example).");
  process.exit(1);
}

const sql = neon(url);

async function runFile(path) {
  const text = readFileSync(new URL(path, import.meta.url), "utf8");
  const withoutComments = text
    .split("\n")
    .filter((line) => !line.trim().startsWith("--"))
    .join("\n");
  const statements = withoutComments
    .split(";")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  for (const statement of statements) {
    await sql.query(statement);
  }
}

await runFile("../db/schema.sql");
await runFile("../db/seed.sql");

console.log("Database schema created and seeded.");
