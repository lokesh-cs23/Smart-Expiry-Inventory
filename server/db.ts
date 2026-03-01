import { Pool } from "pg";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error("❌ DATABASE_URL is not defined");
}

export const db = new Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: false,
  },
});

db.on("connect", () => {
  console.log("✅ Database connected");
});

db.on("error", (err) => {
  console.error("❌ Database error:", err);
});
