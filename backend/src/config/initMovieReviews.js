import pool from "./db.js";

export const initializeMovieReviewsTable = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS flix.movie_reviews (
      id_review SERIAL PRIMARY KEY,
      tmdb_movie_id INTEGER NOT NULL,
      id_user BIGINT NOT NULL REFERENCES flix.users(id_user) ON DELETE CASCADE,
      parent_review_id INTEGER REFERENCES flix.movie_reviews(id_review) ON DELETE CASCADE,
      content TEXT NOT NULL,
      rating SMALLINT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT chk_movie_review_rating
        CHECK (rating IS NULL OR rating BETWEEN 1 AND 5)
    )
  `);

  await pool.query(`
    ALTER TABLE flix.movie_reviews
      ALTER COLUMN id_user TYPE BIGINT USING id_user::BIGINT
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_movie_reviews_tmdb_movie_id
    ON flix.movie_reviews (tmdb_movie_id)
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_movie_reviews_parent_review_id
    ON flix.movie_reviews (parent_review_id)
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS flix.movie_review_likes (
      id_like SERIAL PRIMARY KEY,
      id_review INTEGER NOT NULL REFERENCES flix.movie_reviews(id_review) ON DELETE CASCADE,
      id_user BIGINT NOT NULL REFERENCES flix.users(id_user) ON DELETE CASCADE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT uq_movie_review_likes UNIQUE (id_review, id_user)
    )
  `);

  await pool.query(`
    ALTER TABLE flix.movie_review_likes
      ALTER COLUMN id_user TYPE BIGINT USING id_user::BIGINT
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_movie_review_likes_id_review
    ON flix.movie_review_likes (id_review)
  `);
};
