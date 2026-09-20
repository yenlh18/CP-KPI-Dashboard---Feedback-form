import { neon } from "@neondatabase/serverless";

const url = process.env.DATABASE_URL;

if (!url) {
  // Thrown at request time (not import time) in routes that call getSql(),
  // so the app can still build without DATABASE_URL set.
}

export function getSql() {
  if (!process.env.DATABASE_URL) {
    throw new Error(
      "DATABASE_URL is not set. Add it in your Vercel project's Environment " +
        "Variables (Storage -> your Neon database -> Connect), or in .env.local for local dev."
    );
  }
  return neon(process.env.DATABASE_URL);
}
