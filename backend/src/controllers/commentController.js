import pool from "../config/db.js";

export const getCommentsByPost = async (req, res) => {
  try {
    const { postId } = req.params;

    const result = await pool.query(
      `SELECT
          c.id_comment,
          c.id_post,
          c.id_user,
          c.parent_comment_id,
          c.content,
          c.created_at,
          u.username
       FROM flix.comments c
       JOIN flix.users u ON c.id_user = u.id_user
       WHERE c.id_post = $1
       ORDER BY c.id_comment ASC`,
      [postId],
    );

    return res.json(result.rows);
  } catch (error) {
    return res.status(500).json({
      message: "Gagal mengambil reply",
      error: error.message,
    });
  }
};

export const createComment = async (req, res) => {
  try {
    const { postId } = req.params;
    const { content, parent_comment_id } = req.body;

    if (!content || content.trim() === "") {
      return res.status(400).json({
        message: "Isi reply tidak boleh kosong",
      });
    }

    const postCheck = await pool.query(
      `SELECT id_post FROM flix.posts WHERE id_post = $1`,
      [postId],
    );

    if (postCheck.rows.length === 0) {
      return res.status(404).json({
        message: "Post tidak ditemukan",
      });
    }

    if (parent_comment_id) {
      const parentCheck = await pool.query(
        `SELECT id_comment, id_post
         FROM flix.comments
         WHERE id_comment = $1`,
        [parent_comment_id],
      );

      if (parentCheck.rows.length === 0) {
        return res.status(404).json({
          message: "Comment parent tidak ditemukan",
        });
      }

      if (Number(parentCheck.rows[0].id_post) !== Number(postId)) {
        return res.status(400).json({
          message: "Parent comment tidak sesuai dengan post ini",
        });
      }
    }

    const result = await pool.query(
      `INSERT INTO flix.comments (id_user, id_post, parent_comment_id, content)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [req.user.id_user, postId, parent_comment_id || null, content],
    );

    return res.status(201).json({
      message: "Reply berhasil dibuat",
      comment: result.rows[0],
    });
  } catch (error) {
    return res.status(500).json({
      message: "Gagal membuat reply",
      error: error.message,
    });
  }
};
