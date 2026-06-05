import pool from "../config/db.js";
import bcrypt from "bcrypt";

export const getMyProfile = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT 
          u.id_user,
          u.username,
          u.email,
          u.profile_image_url,
          u.banner_image_url,
          r.role_name,
          u.created_at
       FROM flix.users u
       JOIN flix.roles r ON u.id_role = r.id_role
       WHERE u.id_user = $1`,
      [req.user.id_user]
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

export const getMyProfileActivity = async (req, res) => {
  try {
    const userId = req.user.id_user;

    const [movieReviews, tvSeriesReviews, posts] = await Promise.all([
      pool.query(
        `SELECT
            mr.id_review,
            mr.tmdb_movie_id AS tmdb_id,
            'movie' AS media_type,
            mr.content,
            mr.rating,
            mr.created_at,
            mr.updated_at,
            COALESCE(COUNT(mrl.id_like), 0)::INTEGER AS like_count
         FROM flix.movie_reviews mr
         LEFT JOIN flix.movie_review_likes mrl ON mr.id_review = mrl.id_review
         WHERE mr.id_user = $1
           AND mr.parent_review_id IS NULL
         GROUP BY mr.id_review
         ORDER BY mr.created_at DESC`,
        [userId]
      ),
      pool.query(
        `SELECT
            tr.id_review,
            tr.tmdb_series_id AS tmdb_id,
            'tv' AS media_type,
            tr.content,
            tr.rating,
            tr.created_at,
            tr.updated_at,
            COALESCE(COUNT(trl.id_like), 0)::INTEGER AS like_count
         FROM flix.tv_series_reviews tr
         LEFT JOIN flix.tv_series_review_likes trl ON tr.id_review = trl.id_review
         WHERE tr.id_user = $1
           AND tr.parent_review_id IS NULL
         GROUP BY tr.id_review
         ORDER BY tr.created_at DESC`,
        [userId]
      ),
      pool.query(
        `SELECT
            p.id_post,
            p.title,
            p.content,
            p.image_url,
            p.tags,
            p.post_type,
            p.created_at,
            COALESCE(c.reply_count, 0)::INTEGER AS reply_count,
            COALESCE(l.like_count, 0)::INTEGER AS like_count,
            COALESCE(r.reaction_count, 0)::INTEGER AS reaction_count
         FROM flix.posts p
         LEFT JOIN (
           SELECT id_post, COUNT(*) AS reply_count
           FROM flix.comments
           GROUP BY id_post
         ) c ON p.id_post = c.id_post
         LEFT JOIN (
           SELECT id_post, COUNT(*) AS like_count
           FROM flix.post_likes
           GROUP BY id_post
         ) l ON p.id_post = l.id_post
         LEFT JOIN (
           SELECT id_post, COUNT(*) AS reaction_count
           FROM flix.post_reactions
           GROUP BY id_post
         ) r ON p.id_post = r.id_post
         WHERE p.id_user = $1
         ORDER BY p.created_at DESC`,
        [userId]
      )
    ]);

    const reviews = [...movieReviews.rows, ...tvSeriesReviews.rows].sort(
      (a, b) => new Date(b.created_at) - new Date(a.created_at)
    );

    return res.json({
      stats: {
        review_count: reviews.length,
        movie_review_count: movieReviews.rows.length,
        tv_review_count: tvSeriesReviews.rows.length,
        post_count: posts.rows.length
      },
      reviews,
      posts: posts.rows
    });
  } catch (error) {
    return res.status(500).json({
      message: "Gagal mengambil aktivitas profile",
      error: error.message
    });
  }
};

export const updateMyProfile = async (req, res) => {
  try {
    const { username } = req.body;

    if (!username) {
      return res.status(400).json({
        message: "Username wajib diisi"
      });
    }

    const checkUser = await pool.query(
      `SELECT id_user
       FROM flix.users
       WHERE username = $1
         AND id_user <> $2`,
      [username, req.user.id_user]
    );

    if (checkUser.rows.length > 0) {
      return res.status(400).json({
        message: "Username sudah digunakan user lain"
      });
    }

    const result = await pool.query(
      `UPDATE flix.users
       SET username = $1,
           updated_at = CURRENT_TIMESTAMP
       WHERE id_user = $2
       RETURNING id_user, username, email, profile_image_url, banner_image_url`,
      [username, req.user.id_user]
    );

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

export const updateMyEmail = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email baru dan password wajib diisi"
      });
    }

    const userResult = await pool.query(
      `SELECT id_user, password
       FROM flix.users
       WHERE id_user = $1`,
      [req.user.id_user]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        message: "User tidak ditemukan"
      });
    }

    const isPasswordValid = await bcrypt.compare(password, userResult.rows[0].password);

    if (!isPasswordValid) {
      return res.status(401).json({
        message: "Password konfirmasi salah"
      });
    }

    const checkEmail = await pool.query(
      `SELECT id_user
       FROM flix.users
       WHERE email = $1
         AND id_user <> $2`,
      [email, req.user.id_user]
    );

    if (checkEmail.rows.length > 0) {
      return res.status(400).json({
        message: "Email sudah digunakan user lain"
      });
    }

    const result = await pool.query(
      `UPDATE flix.users
       SET email = $1,
           updated_at = CURRENT_TIMESTAMP
       WHERE id_user = $2
       RETURNING id_user, username, email, profile_image_url, banner_image_url`,
      [email, req.user.id_user]
    );

    return res.json({
      message: "Email berhasil diperbarui",
      user: result.rows[0]
    });
  } catch (error) {
    return res.status(500).json({
      message: "Gagal update email",
      error: error.message
    });
  }
};

export const updateMyPassword = async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({
        message: "Semua field password wajib diisi"
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        message: "Konfirmasi password baru tidak sama"
      });
    }

    if (newPassword.trim().length < 6) {
      return res.status(400).json({
        message: "Password baru minimal 6 karakter"
      });
    }

    const userResult = await pool.query(
      `SELECT id_user, password
       FROM flix.users
       WHERE id_user = $1`,
      [req.user.id_user]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        message: "User tidak ditemukan"
      });
    }

    const isPasswordValid = await bcrypt.compare(currentPassword, userResult.rows[0].password);

    if (!isPasswordValid) {
      return res.status(401).json({
        message: "Kata sandi saat ini salah"
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await pool.query(
      `UPDATE flix.users
       SET password = $1,
           updated_at = CURRENT_TIMESTAMP
       WHERE id_user = $2`,
      [hashedPassword, req.user.id_user]
    );

    return res.json({
      message: "Password berhasil diperbarui"
    });
  } catch (error) {
    return res.status(500).json({
      message: "Gagal update password",
      error: error.message
    });
  }
};

export const deleteMyAccount = async (req, res) => {
  try {
    const result = await pool.query(
      `DELETE FROM flix.users
       WHERE id_user = $1
       RETURNING id_user`,
      [req.user.id_user]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "User tidak ditemukan"
      });
    }

    return res.json({
      message: "Akun berhasil dihapus"
    });
  } catch (error) {
    return res.status(500).json({
      message: "Gagal menghapus akun",
      error: error.message
    });
  }
};

export const updateMyProfileMedia = async (req, res) => {
  try {
    const { field, image_url } = req.body;
    const allowedFields = ["profile_image_url", "banner_image_url"];

    if (!allowedFields.includes(field)) {
      return res.status(400).json({
        message: "Field media profile tidak valid"
      });
    }

    if (!image_url || typeof image_url !== "string") {
      return res.status(400).json({
        message: "URL gambar wajib diisi"
      });
    }

    if (!image_url.startsWith("/uploads/") && !image_url.startsWith("http")) {
      return res.status(400).json({
        message: "URL gambar tidak valid"
      });
    }

    const result = await pool.query(
      `UPDATE flix.users
       SET ${field} = $1,
           updated_at = CURRENT_TIMESTAMP
       WHERE id_user = $2
       RETURNING id_user, username, email, profile_image_url, banner_image_url`,
      [image_url, req.user.id_user]
    );

    return res.json({
      message:
        field === "profile_image_url"
          ? "Foto profile berhasil diperbarui"
          : "Banner profile berhasil diperbarui",
      user: result.rows[0]
    });
  } catch (error) {
    return res.status(500).json({
      message: "Gagal update media profile",
      error: error.message
    });
  }
};
