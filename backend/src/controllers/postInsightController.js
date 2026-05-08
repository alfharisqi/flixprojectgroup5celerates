import pool from "../config/db.js";

export const getPostInsight = async (req, res) => {
  try {
    const { postId } = req.params;

    const postCheck = await pool.query(
      `SELECT id_post, post_type, title
       FROM flix.posts
       WHERE id_post = $1`,
      [postId]
    );

    if (postCheck.rows.length === 0) {
      return res.status(404).json({
        message: "Post tidak ditemukan"
      });
    }

    const post = postCheck.rows[0];

    const likeResult = await pool.query(
      `SELECT COUNT(*) AS total_likes
       FROM flix.post_likes
       WHERE id_post = $1`,
      [postId]
    );

    const replyResult = await pool.query(
      `SELECT COUNT(*) AS total_replies
       FROM flix.comments
       WHERE id_post = $1`,
      [postId]
    );

    const shareResult = await pool.query(
      `SELECT COUNT(*) AS total_shares
       FROM flix.post_shares
       WHERE id_post = $1`,
      [postId]
    );

    const reactionResult = await pool.query(
      `SELECT
          COUNT(*) AS total_reactions,
          SUM(CASE WHEN reaction_type = 'love' THEN 1 ELSE 0 END) AS love_count,
          SUM(CASE WHEN reaction_type = 'funny' THEN 1 ELSE 0 END) AS funny_count,
          SUM(CASE WHEN reaction_type = 'wow' THEN 1 ELSE 0 END) AS wow_count,
          SUM(CASE WHEN reaction_type = 'sad' THEN 1 ELSE 0 END) AS sad_count,
          SUM(CASE WHEN reaction_type = 'angry' THEN 1 ELSE 0 END) AS angry_count
       FROM flix.post_reactions
       WHERE id_post = $1`,
      [postId]
    );

    let pollInsight = null;

    if (post.post_type === "poll") {
      const pollResult = await pool.query(
        `SELECT id_poll
         FROM flix.post_polls
         WHERE id_post = $1`,
        [postId]
      );

      if (pollResult.rows.length > 0) {
        const pollId = pollResult.rows[0].id_poll;

        const optionVotes = await pool.query(
          `SELECT
              o.id_option,
              o.option_text,
              COUNT(v.id_vote) AS vote_count
           FROM flix.post_poll_options o
           LEFT JOIN flix.post_poll_votes v ON o.id_option = v.id_option
           WHERE o.id_poll = $1
           GROUP BY o.id_option
           ORDER BY o.id_option ASC`,
          [pollId]
        );

        const totalPollVotes = await pool.query(
          `SELECT COUNT(*) AS total_poll_votes
           FROM flix.post_poll_votes
           WHERE id_poll = $1`,
          [pollId]
        );

        pollInsight = {
          total_poll_votes: Number(totalPollVotes.rows[0].total_poll_votes),
          options: optionVotes.rows.map((item) => ({
            ...item,
            vote_count: Number(item.vote_count)
          }))
        };
      }
    }

    return res.json({
      post_id: Number(postId),
      title: post.title,
      post_type: post.post_type,
      total_likes: Number(likeResult.rows[0].total_likes),
      total_replies: Number(replyResult.rows[0].total_replies),
      total_shares: Number(shareResult.rows[0].total_shares),
      reactions: {
        total_reactions: Number(reactionResult.rows[0].total_reactions || 0),
        love_count: Number(reactionResult.rows[0].love_count || 0),
        funny_count: Number(reactionResult.rows[0].funny_count || 0),
        wow_count: Number(reactionResult.rows[0].wow_count || 0),
        sad_count: Number(reactionResult.rows[0].sad_count || 0),
        angry_count: Number(reactionResult.rows[0].angry_count || 0)
      },
      poll: pollInsight
    });
  } catch (error) {
    return res.status(500).json({
      message: "Gagal mengambil insight post",
      error: error.message
    });
  }
};