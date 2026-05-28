import pool from "../config/db.js";

const getAuthenticatedUserId = (req) => req.user?.id_user || req.user?.id;

const mapConversation = (row) => ({
  user_id: row.user_id,
  username: row.username,
  email: row.email,
  last_message: row.last_message,
  last_message_at: row.last_message_at,
  unread_count: row.unread_count,
});

const mapMessage = (row, currentUserId) => ({
  id_message: row.id_message,
  sender_id: row.sender_id,
  receiver_id: row.receiver_id,
  message: row.message,
  read_at: row.read_at,
  created_at: row.created_at,
  is_mine: Number(row.sender_id) === Number(currentUserId),
});

export const getConversations = async (req, res) => {
  try {
    const userId = getAuthenticatedUserId(req);

    const result = await pool.query(
      `WITH latest_messages AS (
         SELECT DISTINCT ON (other_user_id)
           other_user_id,
           message AS last_message,
           created_at AS last_message_at
         FROM (
           SELECT
             CASE
               WHEN sender_id = $1 THEN receiver_id
               ELSE sender_id
             END AS other_user_id,
             message,
             created_at
           FROM flix.chat_messages
           WHERE sender_id = $1 OR receiver_id = $1
         ) scoped_messages
         ORDER BY other_user_id, created_at DESC
       ),
       unread_messages AS (
         SELECT sender_id AS other_user_id, COUNT(*)::INTEGER AS unread_count
         FROM flix.chat_messages
         WHERE receiver_id = $1 AND read_at IS NULL
         GROUP BY sender_id
       )
       SELECT
         u.id_user AS user_id,
         u.username,
         u.email,
         lm.last_message,
         lm.last_message_at,
         COALESCE(um.unread_count, 0)::INTEGER AS unread_count
       FROM latest_messages lm
       JOIN flix.users u ON u.id_user = lm.other_user_id
       LEFT JOIN unread_messages um ON um.other_user_id = lm.other_user_id
       ORDER BY lm.last_message_at DESC
       LIMIT 20`,
      [userId],
    );

    return res.json({
      conversations: result.rows.map(mapConversation),
    });
  } catch (error) {
    return res.status(500).json({
      message: "Gagal mengambil chat",
      error: error.message,
    });
  }
};

export const getMessagesWithUser = async (req, res) => {
  try {
    const userId = getAuthenticatedUserId(req);
    const otherUserId = Number(req.params.userId);

    if (!Number.isInteger(otherUserId) || otherUserId <= 0) {
      return res.status(400).json({ message: "User chat tidak valid" });
    }

    await pool.query(
      `UPDATE flix.chat_messages
       SET read_at = CURRENT_TIMESTAMP
       WHERE sender_id = $1 AND receiver_id = $2 AND read_at IS NULL`,
      [otherUserId, userId],
    );

    const [userResult, messagesResult] = await Promise.all([
      pool.query(
        `SELECT id_user AS user_id, username, email
         FROM flix.users
         WHERE id_user = $1`,
        [otherUserId],
      ),
      pool.query(
        `SELECT id_message, sender_id, receiver_id, message, read_at, created_at
         FROM flix.chat_messages
         WHERE (sender_id = $1 AND receiver_id = $2)
            OR (sender_id = $2 AND receiver_id = $1)
         ORDER BY created_at ASC, id_message ASC
         LIMIT 100`,
        [userId, otherUserId],
      ),
    ]);

    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: "User chat tidak ditemukan" });
    }

    return res.json({
      user: userResult.rows[0],
      messages: messagesResult.rows.map((row) => mapMessage(row, userId)),
    });
  } catch (error) {
    return res.status(500).json({
      message: "Gagal mengambil pesan chat",
      error: error.message,
    });
  }
};

export const sendMessageToUser = async (req, res) => {
  try {
    const userId = getAuthenticatedUserId(req);
    const receiverId = Number(req.params.userId);
    const message = req.body.message?.trim();

    if (!Number.isInteger(receiverId) || receiverId <= 0 || receiverId === Number(userId)) {
      return res.status(400).json({ message: "Penerima chat tidak valid" });
    }

    if (!message) {
      return res.status(400).json({ message: "Pesan tidak boleh kosong" });
    }

    const userResult = await pool.query(
      `SELECT id_user FROM flix.users WHERE id_user = $1`,
      [receiverId],
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: "Penerima chat tidak ditemukan" });
    }

    const result = await pool.query(
      `INSERT INTO flix.chat_messages (sender_id, receiver_id, message)
       VALUES ($1, $2, $3)
       RETURNING id_message, sender_id, receiver_id, message, read_at, created_at`,
      [userId, receiverId, message],
    );

    await pool.query(
      `INSERT INTO flix.notifications (id_user, title, message, link_url)
       SELECT $1, $2, $3, $4
       FROM flix.users
       WHERE id_user = $1`,
      [receiverId, "Pesan baru", "Kamu menerima pesan private chat baru.", "/community"],
    );

    return res.status(201).json({
      message: "Pesan terkirim",
      item: mapMessage(result.rows[0], userId),
    });
  } catch (error) {
    return res.status(500).json({
      message: "Gagal mengirim pesan",
      error: error.message,
    });
  }
};
