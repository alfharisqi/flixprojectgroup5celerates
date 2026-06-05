import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pg;

const useSsl =
  process.env.DB_SSL === "true" ||
  process.env.DATABASE_URL?.includes("sslmode=require");

const poolConfig = process.env.DATABASE_URL
  ? {
      connectionString: process.env.DATABASE_URL,
      ssl: useSsl ? { rejectUnauthorized: false } : undefined
    }
  : {
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT),
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      ssl: useSsl ? { rejectUnauthorized: false } : undefined
    };

const pool = new Pool(poolConfig);

export default pool;
