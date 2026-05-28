import pool from "./db.js";

export const initializeWatchlistTable = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS flix.watchlist (
      id_watchlist SERIAL PRIMARY KEY,
      id_user BIGINT NOT NULL REFERENCES flix.users(id_user) ON DELETE CASCADE,
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
    CREATE SEQUENCE IF NOT EXISTS flix.watchlist_id_watchlist_seq
  `);

  await pool.query(`
    ALTER TABLE flix.watchlist
      ADD COLUMN IF NOT EXISTS id_watchlist INTEGER,
      ADD COLUMN IF NOT EXISTS id_user BIGINT,
      ADD COLUMN IF NOT EXISTS media_type VARCHAR(20),
      ADD COLUMN IF NOT EXISTS tmdb_id INTEGER,
      ADD COLUMN IF NOT EXISTS title VARCHAR(255),
      ADD COLUMN IF NOT EXISTS poster_url TEXT,
      ADD COLUMN IF NOT EXISTS backdrop_url TEXT,
      ADD COLUMN IF NOT EXISTS release_date VARCHAR(30),
      ADD COLUMN IF NOT EXISTS overview TEXT,
      ADD COLUMN IF NOT EXISTS vote_average NUMERIC(4, 2),
      ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'pending',
      ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  `);

  await pool.query(`
    ALTER TABLE flix.watchlist
      ALTER COLUMN id_user TYPE BIGINT USING id_user::BIGINT,
      ALTER COLUMN id_watchlist SET DEFAULT nextval('flix.watchlist_id_watchlist_seq'),
      ALTER COLUMN status SET DEFAULT 'pending',
      ALTER COLUMN created_at SET DEFAULT CURRENT_TIMESTAMP,
      ALTER COLUMN updated_at SET DEFAULT CURRENT_TIMESTAMP
  `);

  await pool.query(`
    UPDATE flix.watchlist
    SET status = 'pending'
    WHERE status IS NULL
  `);

  await pool.query(`
    WITH duplicated_watchlist AS (
      SELECT ctid,
             ROW_NUMBER() OVER (
               PARTITION BY id_user, media_type, tmdb_id
               ORDER BY created_at DESC NULLS LAST, id_watchlist DESC NULLS LAST
             ) AS row_number
      FROM flix.watchlist
      WHERE id_user IS NOT NULL
        AND media_type IS NOT NULL
        AND tmdb_id IS NOT NULL
    )
    DELETE FROM flix.watchlist
    WHERE ctid IN (
      SELECT ctid
      FROM duplicated_watchlist
      WHERE row_number > 1
    )
  `);

  await pool.query(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'uq_watchlist_user_media'
          AND conrelid = 'flix.watchlist'::regclass
      ) THEN
        ALTER TABLE flix.watchlist
          ADD CONSTRAINT uq_watchlist_user_media UNIQUE (id_user, media_type, tmdb_id);
      END IF;
    END
    $$;
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
