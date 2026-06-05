import pool from "./db.js";

export const initializeReportsTable = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS flix.reports (
      id_report BIGSERIAL PRIMARY KEY,
      reporter_user_id BIGINT NOT NULL REFERENCES flix.users(id_user) ON DELETE CASCADE,
      report_type VARCHAR(32) NOT NULL CHECK (
        report_type IN (
          'movie_review',
          'tv_series_review',
          'community_post',
          'community_reply'
        )
      ),
      category VARCHAR(40) NOT NULL CHECK (
        category IN (
          'spam',
          'harassment',
          'hate_speech',
          'violence',
          'sexual_content',
          'misinformation',
          'spoiler',
          'copyright',
          'other'
        )
      ),
      reason TEXT NOT NULL,
      status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (
        status IN ('pending', 'reviewed', 'approved', 'rejected')
      ),
      movie_review_id BIGINT REFERENCES flix.movie_reviews(id_review) ON DELETE CASCADE,
      tv_series_review_id BIGINT REFERENCES flix.tv_series_reviews(id_review) ON DELETE CASCADE,
      community_post_id BIGINT REFERENCES flix.posts(id_post) ON DELETE CASCADE,
      community_comment_id BIGINT REFERENCES flix.comments(id_comment) ON DELETE CASCADE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT chk_reports_single_target CHECK (
        (
          (CASE WHEN movie_review_id IS NULL THEN 0 ELSE 1 END) +
          (CASE WHEN tv_series_review_id IS NULL THEN 0 ELSE 1 END) +
          (CASE WHEN community_post_id IS NULL THEN 0 ELSE 1 END) +
          (CASE WHEN community_comment_id IS NULL THEN 0 ELSE 1 END)
        ) = 1
      )
    )
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_reports_reporter_created
    ON flix.reports (reporter_user_id, created_at DESC)
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_reports_type_status_created
    ON flix.reports (report_type, status, created_at DESC)
  `);

  await pool.query(`
    CREATE UNIQUE INDEX IF NOT EXISTS uq_reports_movie_review_user
    ON flix.reports (reporter_user_id, movie_review_id)
    WHERE movie_review_id IS NOT NULL
  `);

  await pool.query(`
    CREATE UNIQUE INDEX IF NOT EXISTS uq_reports_tv_series_review_user
    ON flix.reports (reporter_user_id, tv_series_review_id)
    WHERE tv_series_review_id IS NOT NULL
  `);

  await pool.query(`
    CREATE UNIQUE INDEX IF NOT EXISTS uq_reports_community_post_user
    ON flix.reports (reporter_user_id, community_post_id)
    WHERE community_post_id IS NOT NULL
  `);

  await pool.query(`
    CREATE UNIQUE INDEX IF NOT EXISTS uq_reports_community_comment_user
    ON flix.reports (reporter_user_id, community_comment_id)
    WHERE community_comment_id IS NOT NULL
  `);
};
