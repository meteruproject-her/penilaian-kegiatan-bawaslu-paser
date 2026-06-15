import { defineConfig } from "drizzle-kit";
import "dotenv/config";

const pghost = process.env.PGHOST || "36.50.77.214";
const pgport = process.env.PGPORT || "5432";
const pguser = process.env.PGUSER || "admin_bawaslu";
const pgpassword = process.env.PGPASSWORD || "P4ssw0rd**";
const pgdatabase = process.env.PGDATABASE || "db_bawaslu";

const connectionString = `postgresql://${pguser}:${encodeURIComponent(pgpassword)}@${pghost}:${pgport}/${pgdatabase}?sslmode=disable`;

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: connectionString,
  },
});
