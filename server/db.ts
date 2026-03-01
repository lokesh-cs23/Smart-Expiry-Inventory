import { Pool } from "pg";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not defined");
}

export const db = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

db.on("connect", () => {
  console.log("✅ Database connected successfully");
});

db.on("error", (err) => {
  console.error("❌ Unexpected DB error", err);
});
