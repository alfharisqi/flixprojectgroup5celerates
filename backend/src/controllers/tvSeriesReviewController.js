import pool from "../config/db.js";

const parseSeriesId = (value) => {
  const seriesId = Number(value);
  return Number.isInteger(seriesId) && seriesId > 0 ? seriesId : null;
};

const parseRating = (value) => {
  const rating = Number(value);
  return Number.isInteger(rating) && rating >= 1 && rating <= 5 ? rating : null;
};

export const getTvSeriesReviews = async (req, res) => {
  try {
    const seriesId = parseSeriesId(req.params.seriesId);

    if (!seriesId) {
      return res.status(400).json({
        message: "ID TV series tidak valid",
      });
    }

    const reviewsResult = await pool.query(
      `SELECT
          tsr.id_review,
          tsr.tmdb_series_id,
          tsr.id_user,
          tsr.parent_review_id,
          tsr.content,
          tsr.rating,
          tsr.created_at,
          tsr.updated_at,
          u.username,
          u.profile_image_url,
          COALESCE(COUNT(tsrl.id_like), 0)::INTEGER AS like_count
       FROM flix.tv_series_reviews tsr
       JOIN flix.users u ON tsr.id_user = u.id_user
       LEFT JOIN flix.tv_series_review_likes tsrl ON tsr.id_review = tsrl.id_review
       WHERE tsr.tmdb_series_id = $1
       GROUP BY tsr.id_review, u.username, u.profile_image_url
       ORDER BY tsr.created_at ASC, tsr.id_review ASC`,
      [seriesId],
    );

    const summaryResult = await pool.query(
      `SELECT
          COALESCE(ROUND(AVG(rating)::numeric, 1), 0)::FLOAT AS average_rating,
          COUNT(*)::INTEGER AS review_count
       FROM flix.tv_series_reviews
       WHERE tmdb_series_id = $1
         AND parent_review_id IS NULL
         AND rating IS NOT NULL`,
      [seriesId],
    );

    return res.json({
      summary: summaryResult.rows[0],
      reviews: reviewsResult.rows,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Gagal mengambil review TV series",
      error: error.message,
    });
  }
};

export const createTvSeriesReview = async (req, res) => {
  try {
    const seriesId = parseSeriesId(req.params.seriesId);
    const { content, rating, parent_review_id } = req.body;

    if (!seriesId) {
      return res.status(400).json({
        message: "ID TV series tidak valid",
      });
    }

    if (!content || content.trim() === "") {
      return res.status(400).json({
        message: "Isi review tidak boleh kosong",
      });
    }

    const parentId = parent_review_id ? Number(parent_review_id) : null;
    let reviewRating = null;

    if (parentId) {
      const parentCheck = await pool.query(
        `SELECT id_review, tmdb_series_id
         FROM flix.tv_series_reviews
         WHERE id_review = $1`,
        [parentId],
      );

      if (parentCheck.rows.length === 0) {
        return res.status(404).json({
          message: "Review parent tidak ditemukan",
        });
      }

      if (Number(parentCheck.rows[0].tmdb_series_id) !== seriesId) {
        return res.status(400).json({
          message: "Reply tidak sesuai dengan TV series ini",
        });
      }
    } else {
      reviewRating = parseRating(rating);

      if (!reviewRating) {
        return res.status(400).json({
          message: "Rating review wajib 1 sampai 5",
        });
      }
    }

    const result = await pool.query(
      `INSERT INTO flix.tv_series_reviews
        (tmdb_series_id, id_user, parent_review_id, content, rating)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [seriesId, req.user.id_user, parentId, content.trim(), reviewRating],
    );

    return res.status(201).json({
      message: parentId ? "Reply review berhasil dibuat" : "Review berhasil dibuat",
      review: result.rows[0],
    });
  } catch (error) {
    return res.status(500).json({
      message: "Gagal membuat review TV series",
      error: error.message,
    });
  }
};

export const toggleLikeTvSeriesReview = async (req, res) => {
  try {
    const reviewId = Number(req.params.reviewId);

    if (!Number.isInteger(reviewId) || reviewId <= 0) {
      return res.status(400).json({
        message: "ID review tidak valid",
      });
    }

    const reviewCheck = await pool.query(
      `SELECT id_review FROM flix.tv_series_reviews WHERE id_review = $1`,
      [reviewId],
    );

    if (reviewCheck.rows.length === 0) {
      return res.status(404).json({
        message: "Review tidak ditemukan",
      });
    }

    const existingLike = await pool.query(
      `SELECT id_like
       FROM flix.tv_series_review_likes
       WHERE id_review = $1 AND id_user = $2`,
      [reviewId, req.user.id_user],
    );

    if (existingLike.rows.length > 0) {
      await pool.query(
        `DELETE FROM flix.tv_series_review_likes WHERE id_like = $1`,
        [existingLike.rows[0].id_like],
      );

      return res.json({
        message: "Like review dihapus",
      });
    }

    await pool.query(
      `INSERT INTO flix.tv_series_review_likes (id_review, id_user)
       VALUES ($1, $2)`,
      [reviewId, req.user.id_user],
    );

    return res.json({
      message: "Review berhasil di-like",
    });
  } catch (error) {
    return res.status(500).json({
      message: "Gagal memberi like review",
      error: error.message,
    });
  }
};
