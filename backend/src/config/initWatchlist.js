import pool from "./db.js";

export const initializeWatchlistTable = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS flix.watchlist (
      id_watchlist SERIAL PRIMARY KEY,
      id_user INTEGER NOT NULL REFERENCES flix.users(id_user) ON DELETE CASCADE,
      media_type VARCHAR(20) NOT NULL CHECK (media_type IN ('movie', 'tv')),
      tmdb_id INTEGER NOT NULL,
      title VARCHAR(255) NOT NULL,
      poster_url TEXT,
      backdrop_url TEXT,
      release_date VARCHAR(30),
      overview TEXT,
      vote_average NUMERIC(4, 2),
      status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'watched')),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT uq_watchlist_user_media UNIQUE (id_user, media_type, tmdb_id)
    )
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_watchlist_user_status
    ON flix.watchlist (id_user, status)
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_watchlist_user_media
    ON flix.watchlist (id_user, media_type, tmdb_id)
  `);
};
