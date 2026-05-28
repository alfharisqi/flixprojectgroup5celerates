import pool from "../config/db.js";
import bcrypt from "bcrypt";

const getAuthenticatedUserId = (req) => req.user?.id_user || req.user?.id;

export const getMyProfile = async (req, res) => {
  try {
    const userId = getAuthenticatedUserId(req);

    const result = await pool.query(
      `SELECT 
          u.id_user,
          u.username,
          u.email,
          u.profile_photo_url,
          u.banner_url,
          u.profile_photo_position,
          u.banner_position,
          r.role_name,
          u.created_at
       FROM flix.users u
       JOIN flix.roles r ON u.id_role = r.id_role
       WHERE u.id_user = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "User tidak ditemukan"
      });
    }

    return res.json(result.rows[0]);
  } catch (error) {
    return res.status(500).json({
      message: "Gagal mengambil profile",
      error: error.message
    });
  }
};

export const updateMyProfile = async (req, res) => {
  try {
    const userId = getAuthenticatedUserId(req);
    const {
      username,
      email,
      password,
      profile_photo_url,
      banner_url,
      profile_photo_position = "50% 50%",
      banner_position = "50% 50%",
    } = req.body;

    if (!username || !email) {
      return res.status(400).json({
        message: "Username dan email wajib diisi"
      });
    }

    const checkUser = await pool.query(
      `SELECT id_user
       FROM flix.users
       WHERE (username = $1 OR email = $2)
         AND id_user <> $3`,
      [username, email, userId]
    );

    if (checkUser.rows.length > 0) {
      return res.status(400).json({
        message: "Username atau email sudah digunakan user lain"
      });
    }

    let result;

    if (password && password.trim() !== "") {
      const hashedPassword = await bcrypt.hash(password, 10);

      result = await pool.query(
        `UPDATE flix.users
         SET username = $1,
             email = $2,
             password = $3,
             profile_photo_url = $4,
             banner_url = $5,
             profile_photo_position = $6,
             banner_position = $7,
             updated_at = CURRENT_TIMESTAMP
         WHERE id_user = $8
         RETURNING id_user, username, email, profile_photo_url, banner_url, profile_photo_position, banner_position`,
        [
          username,
          email,
          hashedPassword,
          profile_photo_url || null,
          banner_url || null,
          profile_photo_position,
          banner_position,
          userId,
        ]
      );
    } else {
      result = await pool.query(
        `UPDATE flix.users
         SET username = $1,
             email = $2,
             profile_photo_url = $3,
             banner_url = $4,
             profile_photo_position = $5,
             banner_position = $6,
             updated_at = CURRENT_TIMESTAMP
         WHERE id_user = $7
         RETURNING id_user, username, email, profile_photo_url, banner_url, profile_photo_position, banner_position`,
        [
          username,
          email,
          profile_photo_url || null,
          banner_url || null,
          profile_photo_position,
          banner_position,
          userId,
        ]
      );
    }

    return res.json({
      message: "Profile berhasil diperbarui",
      user: result.rows[0]
    });
  } catch (error) {
    return res.status(500).json({
      message: "Gagal update profile",
      error: error.message
    });
  }
};

export const getMyReviews = async (req, res) => {
  try {
    const userId = getAuthenticatedUserId(req);

    const result = await pool.query(
      `SELECT *
       FROM (
         SELECT
           'movie' AS media_type,
           mr.id_review,
           mr.tmdb_movie_id AS tmdb_id,
           mr.parent_review_id,
           mr.content,
           mr.rating,
           mr.created_at,
           mr.updated_at,
           COALESCE(w.title, 'Movie #' || mr.tmdb_movie_id::text) AS title,
           w.poster_url,
           COALESCE(COUNT(mrl.id_like), 0)::INTEGER AS like_count
         FROM flix.movie_reviews mr
         LEFT JOIN flix.watchlist w
           ON w.id_user = mr.id_user
          AND w.media_type = 'movie'
          AND w.tmdb_id = mr.tmdb_movie_id
         LEFT JOIN flix.movie_review_likes mrl
           ON mrl.id_review = mr.id_review
         WHERE mr.id_user = $1
         GROUP BY mr.id_review, w.title, w.poster_url

         UNION ALL

         SELECT
           'tv' AS media_type,
           tsr.id_review,
           tsr.tmdb_series_id AS tmdb_id,
           tsr.parent_review_id,
           tsr.content,
           tsr.rating,
           tsr.created_at,
           tsr.updated_at,
           COALESCE(w.title, 'TV Series #' || tsr.tmdb_series_id::text) AS title,
           w.poster_url,
           COALESCE(COUNT(tsrl.id_like), 0)::INTEGER AS like_count
         FROM flix.tv_series_reviews tsr
         LEFT JOIN flix.watchlist w
           ON w.id_user = tsr.id_user
          AND w.media_type = 'tv'
          AND w.tmdb_id = tsr.tmdb_series_id
         LEFT JOIN flix.tv_series_review_likes tsrl
           ON tsrl.id_review = tsr.id_review
         WHERE tsr.id_user = $1
         GROUP BY tsr.id_review, w.title, w.poster_url
       ) user_reviews
       ORDER BY created_at DESC, id_review DESC
       LIMIT 50`,
      [userId],
    );

    const rootReviews = result.rows.filter((review) => !review.parent_review_id);
    const ratedReviews = rootReviews.filter((review) => review.rating !== null);
    const averageRating =
      ratedReviews.length === 0
        ? 0
        : ratedReviews.reduce((total, review) => total + Number(review.rating), 0) /
          ratedReviews.length;

    return res.json({
      summary: {
        total_reviews: result.rows.length,
        review_count: rootReviews.length,
        reply_count: result.rows.length - rootReviews.length,
        average_rating: Number(averageRating.toFixed(1)),
      },
      reviews: result.rows,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Gagal mengambil review user",
      error: error.message,
    });
  }
};
