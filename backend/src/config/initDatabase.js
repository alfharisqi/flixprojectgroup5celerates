import pool from "./db.js";

export const initializeDatabaseSchema = async () => {
  await pool.query("CREATE SCHEMA IF NOT EXISTS flix");

  await pool.query(`
    CREATE TABLE IF NOT EXISTS flix.roles (
      id_role BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
      role_name VARCHAR(50) NOT NULL UNIQUE,
      description TEXT
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS flix.users (
      id_user BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
      id_role BIGINT NOT NULL REFERENCES flix.roles(id_role) ON DELETE RESTRICT,
      username VARCHAR(100) NOT NULL UNIQUE,
      email VARCHAR(100) NOT NULL UNIQUE,
      password VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await pool.query(`
    INSERT INTO flix.roles (role_name, description)
    VALUES
      ('registered_user', 'User biasa yang sudah terdaftar'),
      ('moderator', 'Moderator komunitas'),
      ('admin', 'Administrator aplikasi')
    ON CONFLICT (role_name) DO UPDATE
      SET description = EXCLUDED.description
  `);
};
