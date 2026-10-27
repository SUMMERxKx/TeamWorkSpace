import { Pool } from "pg";

import { env } from "./env";

/**
 * One Pool for the whole process.
 *
 * A Pool keeps a set of reusable connections; a Client is a single
 * connection you open and close yourself. A web server wants the Pool.
 */
export const pool = new Pool({
  connectionString: env.DATABASE_URL,
  // Fail a health check quickly rather than hanging when Postgres is down.
  connectionTimeoutMillis: 2000,
});

/**
 * Without this listener, an error on an idle pooled client is emitted
 * on the Pool as an unhandled 'error' event and takes the process down.
 * This is what keeps the API alive when Postgres stops.
 */
pool.on("error", (err) => {
  console.error("Idle database client error:", err.message);
});

export async function checkDatabase(): Promise<"up" | "down"> {
  try {
    await pool.query("SELECT 1");
    return "up";
  } catch {
    return "down";
  }
}
