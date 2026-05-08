import pool from "../config/db.js";

export const getPosts = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT 
          p.id_post,
          p.title,
          p.content,
          p.image_url,
          p.tags,
          p.post_type,
          p.created_at,
          u.id_user,
          u.username,

          COALESCE(l.like_count, 0) AS like_count,

          COALESCE(r.love_count, 0) AS love_count,
          COALESCE(r.funny_count, 0) AS funny_count,
          COALESCE(r.wow_count, 0) AS wow_count,
          COALESCE(r.sad_count, 0) AS sad_count,
          COALESCE(r.angry_count, 0) AS angry_count

       FROM flix.posts p
       JOIN flix.users u ON p.id_user = u.id_user

       LEFT JOIN (
         SELECT id_post, COUNT(*) AS like_count
         FROM flix.post_likes
         GROUP BY id_post
       ) l ON p.id_post = l.id_post

       LEFT JOIN (
         SELECT
           id_post,
           SUM(CASE WHEN reaction_type = 'love' THEN 1 ELSE 0 END) AS love_count,
           SUM(CASE WHEN reaction_type = 'funny' THEN 1 ELSE 0 END) AS funny_count,
           SUM(CASE WHEN reaction_type = 'wow' THEN 1 ELSE 0 END) AS wow_count,
           SUM(CASE WHEN reaction_type = 'sad' THEN 1 ELSE 0 END) AS sad_count,
           SUM(CASE WHEN reaction_type = 'angry' THEN 1 ELSE 0 END) AS angry_count
         FROM flix.post_reactions
         GROUP BY id_post
       ) r ON p.id_post = r.id_post

       ORDER BY p.id_post DESC`
    );

    return res.json(result.rows);
  } catch (error) {
    return res.status(500).json({
      message: "Gagal mengambil posts",
      error: error.message
    });
  }
};

export const getPostById = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT 
          p.id_post,
          p.title,
          p.content,
          p.image_url,
          p.tags,
          p.post_type,
          p.created_at,
          u.id_user,
          u.username,

          COALESCE(l.like_count, 0) AS like_count,

          COALESCE(r.love_count, 0) AS love_count,
          COALESCE(r.funny_count, 0) AS funny_count,
          COALESCE(r.wow_count, 0) AS wow_count,
          COALESCE(r.sad_count, 0) AS sad_count,
          COALESCE(r.angry_count, 0) AS angry_count

       FROM flix.posts p
       JOIN flix.users u ON p.id_user = u.id_user

       LEFT JOIN (
         SELECT id_post, COUNT(*) AS like_count
         FROM flix.post_likes
         GROUP BY id_post
       ) l ON p.id_post = l.id_post

       LEFT JOIN (
         SELECT
           id_post,
           SUM(CASE WHEN reaction_type = 'love' THEN 1 ELSE 0 END) AS love_count,
           SUM(CASE WHEN reaction_type = 'funny' THEN 1 ELSE 0 END) AS funny_count,
           SUM(CASE WHEN reaction_type = 'wow' THEN 1 ELSE 0 END) AS wow_count,
           SUM(CASE WHEN reaction_type = 'sad' THEN 1 ELSE 0 END) AS sad_count,
           SUM(CASE WHEN reaction_type = 'angry' THEN 1 ELSE 0 END) AS angry_count
         FROM flix.post_reactions
         GROUP BY id_post
       ) r ON p.id_post = r.id_post

       WHERE p.id_post = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Post tidak ditemukan"
      });
    }

    return res.json(result.rows[0]);
  } catch (error) {
    return res.status(500).json({
      message: "Gagal mengambil detail post",
      error: error.message
    });
  }
};

export const createPost = async (req, res) => {
  const client = await pool.connect();

  try {
    const { title, content, tags, post_type, poll_options } = req.body;

    if (!title || title.trim() === "") {
      return res.status(400).json({
        message: "Title wajib diisi"
      });
    }

    const parsedTags = tags ? JSON.parse(tags) : [];
    const parsedPollOptions = poll_options ? JSON.parse(poll_options) : [];
    const finalPostType = post_type || "post";

    if (finalPostType === "poll") {
      const validOptions = parsedPollOptions.filter(
        (item) => item && item.trim() !== ""
      );

      if (validOptions.length < 2) {
        return res.status(400).json({
          message: "Polling minimal harus punya 2 opsi"
        });
      }
    }

    const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;

    await client.query("BEGIN");

    const postResult = await client.query(
      `INSERT INTO flix.posts (id_user, title, content, image_url, tags, post_type)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        req.user.id_user,
        title,
        content || "",
        imageUrl,
        parsedTags,
        finalPostType
      ]
    );

    const createdPost = postResult.rows[0];

    if (finalPostType === "poll") {
      const pollResult = await client.query(
        `INSERT INTO flix.post_polls (id_post)
         VALUES ($1)
         RETURNING *`,
        [createdPost.id_post]
      );

      const poll = pollResult.rows[0];

      const validOptions = parsedPollOptions.filter(
        (item) => item && item.trim() !== ""
      );

      for (const option of validOptions) {
        await client.query(
          `INSERT INTO flix.post_poll_options (id_poll, option_text)
           VALUES ($1, $2)`,
          [poll.id_poll, option]
        );
      }
    }

    await client.query("COMMIT");

    return res.status(201).json({
      message: "Post berhasil dibuat",
      post: createdPost
    });
  } catch (error) {
    await client.query("ROLLBACK");
    return res.status(500).json({
      message: "Gagal membuat post",
      error: error.message
    });
  } finally {
    client.release();
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

    await pool.query(`DELETE FROM flix.posts WHERE id_post = $1`, [id]);

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