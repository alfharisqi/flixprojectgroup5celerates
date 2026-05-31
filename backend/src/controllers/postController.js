import pool from "../config/db.js";

export const getPosts = async (req, res) => {
  try {
    const tag = typeof req.query.tag === "string" ? req.query.tag.trim() : "";
    const values = [req.user?.id_user || null];
    let tagFilter = "";

    if (tag) {
      values.push(tag);
      tagFilter = `
       WHERE EXISTS (
         SELECT 1
         FROM unnest(p.tags) AS tag_name
         WHERE LOWER(tag_name) = LOWER($${values.length})
       )`;
    }

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
          u.profile_image_url,

          COALESCE(v.view_count, 0) AS view_count,
          COALESCE(c.reply_count, 0) AS reply_count,
          COALESCE(s.share_count, 0) AS share_count,
          COALESCE(l.like_count, 0) AS like_count,

          COALESCE(r.total_reactions, 0) AS total_reactions,
          COALESCE(r.love_count, 0) AS love_count,
          COALESCE(r.funny_count, 0) AS funny_count,
          COALESCE(r.wow_count, 0) AS wow_count,
          COALESCE(r.sad_count, 0) AS sad_count,
          COALESCE(r.angry_count, 0) AS angry_count,
          ur.reaction_type AS user_reaction,
          COALESCE(po.total_votes, 0) AS poll_vote_count,

          (
            COALESCE(v.view_count, 0) +
            COALESCE(c.reply_count, 0) +
            COALESCE(s.share_count, 0) +
            COALESCE(l.like_count, 0) +
            COALESCE(r.total_reactions, 0) +
            COALESCE(po.total_votes, 0)
          ) AS total_insight,

          CASE
            WHEN pp.id_poll IS NULL THEN NULL
            ELSE json_build_object(
              'id_poll', pp.id_poll,
              'id_post', pp.id_post,
              'total_votes', COALESCE(po.total_votes, 0),
              'options', COALESCE(po.options, '[]'::json)
            )
          END AS poll

       FROM flix.posts p
       JOIN flix.users u ON p.id_user = u.id_user

       LEFT JOIN (
         SELECT id_post, COUNT(*) AS view_count
         FROM flix.post_views
         GROUP BY id_post
       ) v ON p.id_post = v.id_post

       LEFT JOIN (
         SELECT id_post, COUNT(*) AS reply_count
         FROM flix.comments
         GROUP BY id_post
       ) c ON p.id_post = c.id_post

       LEFT JOIN (
         SELECT id_post, COUNT(*) AS share_count
         FROM flix.post_shares
         GROUP BY id_post
       ) s ON p.id_post = s.id_post

       LEFT JOIN (
         SELECT id_post, COUNT(*) AS like_count
         FROM flix.post_likes
         GROUP BY id_post
       ) l ON p.id_post = l.id_post

       LEFT JOIN (
         SELECT
           id_post,
           COUNT(*) AS total_reactions,
           SUM(CASE WHEN reaction_type = 'love' THEN 1 ELSE 0 END) AS love_count,
           SUM(CASE WHEN reaction_type = 'funny' THEN 1 ELSE 0 END) AS funny_count,
           SUM(CASE WHEN reaction_type = 'wow' THEN 1 ELSE 0 END) AS wow_count,
           SUM(CASE WHEN reaction_type = 'sad' THEN 1 ELSE 0 END) AS sad_count,
           SUM(CASE WHEN reaction_type = 'angry' THEN 1 ELSE 0 END) AS angry_count
         FROM flix.post_reactions
         GROUP BY id_post
       ) r ON p.id_post = r.id_post

       LEFT JOIN flix.post_reactions ur
         ON p.id_post = ur.id_post
        AND ur.id_user = $1

       LEFT JOIN flix.post_polls pp ON p.id_post = pp.id_post

       LEFT JOIN LATERAL (
         SELECT json_agg(
           json_build_object(
             'id_option', o.id_option,
             'option_text', o.option_text,
             'vote_count', COALESCE(votes.vote_count, 0)
           )
           ORDER BY o.id_option ASC
         ) AS options,
         COALESCE(SUM(COALESCE(votes.vote_count, 0)), 0) AS total_votes
         FROM flix.post_poll_options o
         LEFT JOIN (
           SELECT id_option, COUNT(*) AS vote_count
           FROM flix.post_poll_votes
           GROUP BY id_option
         ) votes ON o.id_option = votes.id_option
         WHERE o.id_poll = pp.id_poll
       ) po ON TRUE

       ${tagFilter}
       ORDER BY p.id_post DESC`,
      values
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
    const userId = req.user?.id_user || null;

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
          u.profile_image_url,

          COALESCE(v.view_count, 0) AS view_count,
          COALESCE(c.reply_count, 0) AS reply_count,
          COALESCE(s.share_count, 0) AS share_count,
          COALESCE(l.like_count, 0) AS like_count,

          COALESCE(r.total_reactions, 0) AS total_reactions,
          COALESCE(r.love_count, 0) AS love_count,
          COALESCE(r.funny_count, 0) AS funny_count,
          COALESCE(r.wow_count, 0) AS wow_count,
          COALESCE(r.sad_count, 0) AS sad_count,
          COALESCE(r.angry_count, 0) AS angry_count,
          ur.reaction_type AS user_reaction,
          COALESCE(pv.poll_vote_count, 0) AS poll_vote_count,

          (
            COALESCE(v.view_count, 0) +
            COALESCE(c.reply_count, 0) +
            COALESCE(s.share_count, 0) +
            COALESCE(l.like_count, 0) +
            COALESCE(r.total_reactions, 0) +
            COALESCE(pv.poll_vote_count, 0)
          ) AS total_insight

       FROM flix.posts p
       JOIN flix.users u ON p.id_user = u.id_user

       LEFT JOIN (
         SELECT id_post, COUNT(*) AS view_count
         FROM flix.post_views
         GROUP BY id_post
       ) v ON p.id_post = v.id_post

       LEFT JOIN (
         SELECT id_post, COUNT(*) AS reply_count
         FROM flix.comments
         GROUP BY id_post
       ) c ON p.id_post = c.id_post

       LEFT JOIN (
         SELECT id_post, COUNT(*) AS share_count
         FROM flix.post_shares
         GROUP BY id_post
       ) s ON p.id_post = s.id_post

       LEFT JOIN (
         SELECT id_post, COUNT(*) AS like_count
         FROM flix.post_likes
         GROUP BY id_post
       ) l ON p.id_post = l.id_post

       LEFT JOIN (
         SELECT
           id_post,
           COUNT(*) AS total_reactions,
           SUM(CASE WHEN reaction_type = 'love' THEN 1 ELSE 0 END) AS love_count,
           SUM(CASE WHEN reaction_type = 'funny' THEN 1 ELSE 0 END) AS funny_count,
           SUM(CASE WHEN reaction_type = 'wow' THEN 1 ELSE 0 END) AS wow_count,
           SUM(CASE WHEN reaction_type = 'sad' THEN 1 ELSE 0 END) AS sad_count,
           SUM(CASE WHEN reaction_type = 'angry' THEN 1 ELSE 0 END) AS angry_count
         FROM flix.post_reactions
         GROUP BY id_post
       ) r ON p.id_post = r.id_post

       LEFT JOIN flix.post_reactions ur
         ON p.id_post = ur.id_post
        AND ur.id_user = $2

       LEFT JOIN (
         SELECT pp.id_post, COUNT(v.id_vote) AS poll_vote_count
         FROM flix.post_polls pp
         JOIN flix.post_poll_options o ON pp.id_poll = o.id_poll
         LEFT JOIN flix.post_poll_votes v ON o.id_option = v.id_option
         GROUP BY pp.id_post
       ) pv ON p.id_post = pv.id_post

       WHERE p.id_post = $1`,
      [id, userId]
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
