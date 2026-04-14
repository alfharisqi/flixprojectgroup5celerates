import pool from "../config/db.js";

export const getPosts = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT 
          p.id_post,
          p.content,
          p.created_at,
          u.id_user,
          u.username
       FROM flix.posts p
       JOIN flix.users u ON p.id_user = u.id_user
       ORDER BY p.id_post DESC`
    );

    return res.json(result.rows);
  } catch (error) {
    return res.status(500).json({
      message: "Gagal mengambil post",
      error: error.message
    });
  }
};

export const createPost = async (req, res) => {
  try {
    const { content } = req.body;

    if (!content || content.trim() === "") {
      return res.status(400).json({
        message: "Isi post tidak boleh kosong"
      });
    }

    const result = await pool.query(
      `INSERT INTO flix.posts (id_user, content)
       VALUES ($1, $2)
       RETURNING *`,
      [req.user.id_user, content]
    );

    return res.status(201).json({
      message: "Post berhasil dibuat",
      post: result.rows[0]
    });
  } catch (error) {
    return res.status(500).json({
      message: "Gagal membuat post",
      error: error.message
    });
  }
};

export const deletePost = async (req, res) => {
  try {
    const { id } = req.params;

    const postResult = await pool.query(
      `SELECT id_post, id_user
       FROM flix.posts
       WHERE id_post = $1`,
      [id]
    );

    if (postResult.rows.length === 0) {
      return res.status(404).json({
        message: "Post tidak ditemukan"
      });
    }

    const post = postResult.rows[0];

    const isOwner = Number(post.id_user) === Number(req.user.id_user);
    const isModerator = req.user.role === "moderator";
    const isAdmin = req.user.role === "admin";

    if (!isOwner && !isModerator && !isAdmin) {
      return res.status(403).json({
        message: "Kamu tidak punya akses untuk menghapus post ini"
      });
    }

    await pool.query(
      `DELETE FROM flix.posts
       WHERE id_post = $1`,
      [id]
    );

    return res.json({
      message: "Post berhasil dihapus"
    });
  } catch (error) {
    return res.status(500).json({
      message: "Gagal menghapus post",
      error: error.message
    });
  }
};