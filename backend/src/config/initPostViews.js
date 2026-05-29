import pool from "./db.js";

export const initializePostViewsTable = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS flix.post_views (
      id_view SERIAL PRIMARY KEY,
      id_post BIGINT NOT NULL REFERENCES flix.posts(id_post) ON DELETE CASCADE,
      id_user BIGINT NOT NULL REFERENCES flix.users(id_user) ON DELETE CASCADE,
      viewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await pool.query(`
    ALTER TABLE flix.post_views
      ALTER COLUMN id_post TYPE BIGINT USING id_post::BIGINT,
      ALTER COLUMN id_user TYPE BIGINT USING id_user::BIGINT
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_post_views_id_post
    ON flix.post_views (id_post)
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_post_views_id_user
    ON flix.post_views (id_user)
  `);

  await pool.query(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_post_views_unique_post_user
    ON flix.post_views (id_post, id_user)
  `);
};
