import pool from "../config/db.js";

const getAuthenticatedUserId = (req) => req.user?.id_user || req.user?.id;

const mapNotification = (row) => ({
  id_notification: row.id_notification,
  title: row.title,
  message: row.message,
  link_url: row.link_url,
  read_at: row.read_at,
  created_at: row.created_at,
});

export const getNotifications = async (req, res) => {
  try {
    const userId = getAuthenticatedUserId(req);

    const result = await pool.query(
      `SELECT id_notification, title, message, link_url, read_at, created_at
       FROM flix.notifications
       WHERE id_user = $1
       ORDER BY created_at DESC, id_notification DESC
       LIMIT 30`,
      [userId],
    );

    return res.json({
      unread_count: result.rows.filter((row) => !row.read_at).length,
      notifications: result.rows.map(mapNotification),
    });
  } catch (error) {
    return res.status(500).json({
      message: "Gagal mengambil notifikasi",
      error: error.message,
    });
  }
};

export const markNotificationRead = async (req, res) => {
  try {
    const userId = getAuthenticatedUserId(req);
    const notificationId = Number(req.params.id);

    if (!Number.isInteger(notificationId) || notificationId <= 0) {
      return res.status(400).json({ message: "Notifikasi tidak valid" });
    }

    const result = await pool.query(
      `UPDATE flix.notifications
       SET read_at = COALESCE(read_at, CURRENT_TIMESTAMP)
       WHERE id_notification = $1 AND id_user = $2
       RETURNING id_notification, title, message, link_url, read_at, created_at`,
      [notificationId, userId],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Notifikasi tidak ditemukan" });
    }

    return res.json({
      message: "Notifikasi ditandai sudah dibaca",
      notification: mapNotification(result.rows[0]),
    });
  } catch (error) {
    return res.status(500).json({
      message: "Gagal memperbarui notifikasi",
      error: error.message,
    });
  }
};

export const markAllNotificationsRead = async (req, res) => {
  try {
    const userId = getAuthenticatedUserId(req);

    await pool.query(
      `UPDATE flix.notifications
       SET read_at = COALESCE(read_at, CURRENT_TIMESTAMP)
       WHERE id_user = $1 AND read_at IS NULL`,
      [userId],
    );

    return res.json({ message: "Semua notifikasi ditandai sudah dibaca" });
  } catch (error) {
    return res.status(500).json({
      message: "Gagal memperbarui notifikasi",
      error: error.message,
    });
  }
};
