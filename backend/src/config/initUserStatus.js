import pool from "./db.js";

export const initializeUserStatusColumns = async () => {
  // Tambah kolom is_active jika belum ada
  await pool.query(`
    ALTER TABLE flix.users
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  `);

  await pool.query(`
    ALTER TABLE flix.users
    ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE NOT NULL
  `);

  // Tambah kolom deactivated_at jika belum ada
  await pool.query(`
    ALTER TABLE flix.users
    ADD COLUMN IF NOT EXISTS deactivated_at TIMESTAMP
  `);

  // Tambah kolom deactivated_by_user_id jika belum ada
  await pool.query(`
    ALTER TABLE flix.users
    ADD COLUMN IF NOT EXISTS deactivated_by_user_id BIGINT
  `);

  // 1. TAMBAHKAN: Kolom is_premium jika belum ada
  await pool.query(`
    ALTER TABLE flix.users
    ADD COLUMN IF NOT EXISTS is_premium BOOLEAN DEFAULT FALSE NOT NULL
  `);

  // 2. TAMBAHKAN: Kolom payment_proof untuk menyimpan path bukti pembayaran
  await pool.query(`
    ALTER TABLE flix.users
    ADD COLUMN IF NOT EXISTS payment_proof VARCHAR(255)
  `);

  // Tambah indeks untuk performa pencarian status aktif
  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_users_is_active
    ON flix.users (is_active)
  `);
};
