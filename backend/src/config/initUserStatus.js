import pool from "./db.js";

export const initializeUserStatusColumns = async () => {
  await pool.query(`
    ALTER TABLE flix.users
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  `);

  await pool.query(`
    ALTER TABLE flix.users
    ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE NOT NULL
  `);

  await pool.query(`
    ALTER TABLE flix.users
    ADD COLUMN IF NOT EXISTS deactivated_at TIMESTAMP
  `);

  await pool.query(`
    ALTER TABLE flix.users
    ADD COLUMN IF NOT EXISTS deactivated_by_user_id BIGINT
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_users_is_active
    ON flix.users (is_active)
  `);
};
