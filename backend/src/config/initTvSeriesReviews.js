import pool from "./db.js";

export const initializeTvSeriesReviewsTable = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS flix.tv_series_reviews (
      id_review SERIAL PRIMARY KEY,
      tmdb_series_id INTEGER NOT NULL,
      id_user INTEGER NOT NULL REFERENCES flix.users(id_user) ON DELETE CASCADE,
      parent_review_id INTEGER REFERENCES flix.tv_series_reviews(id_review) ON DELETE CASCADE,
      content TEXT NOT NULL,
      rating SMALLINT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT chk_tv_series_review_rating
        CHECK (rating IS NULL OR rating BETWEEN 1 AND 5)
    )
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_tv_series_reviews_tmdb_series_id
    ON flix.tv_series_reviews (tmdb_series_id)
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_tv_series_reviews_parent_review_id
    ON flix.tv_series_reviews (parent_review_id)
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS flix.tv_series_review_likes (
      id_like SERIAL PRIMARY KEY,
      id_review INTEGER NOT NULL REFERENCES flix.tv_series_reviews(id_review) ON DELETE CASCADE,
      id_user INTEGER NOT NULL REFERENCES flix.users(id_user) ON DELETE CASCADE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT uq_tv_series_review_likes UNIQUE (id_review, id_user)
    )
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_tv_series_review_likes_id_review
    ON flix.tv_series_review_likes (id_review)
  `);
};
